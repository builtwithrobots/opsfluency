import "server-only";

import type { GlossaryRow } from "@/lib/types/glossary";
import { extractPdfText } from "./pdf-extraction";

import { SONNET_MODEL, callSonnet, type SonnetResult, type SonnetUserContent } from "./sonnet";

/**
 * SOP conversion — two-call pipeline, both calls on Sonnet.
 *
 * Call 1 — Sonnet: raw document → clean Markdown.
 *   Sonnet for both steps because SOPs are safety-critical documents.
 *   Managers should not need to proof the Markdown output for structural
 *   errors — Sonnet's consistency over complex tables, implied warnings,
 *   and ambiguous layouts justifies the cost over Haiku.
 *
 * Call 2 — Sonnet: Markdown + glossary → flagged site-specific terms.
 *   Reasoning-heavy: Sonnet must distinguish generic English from
 *   in-house proper nouns, acronyms, and equipment jargon. Quality here
 *   directly gates translation accuracy for every worker. Sonnet's input
 *   for this step is the compact Markdown (not the raw document), so the
 *   call is ~60% cheaper than the single-call approach was.
 *
 * Both calls write separate `ai_call_log` rows so the AI usage tab can
 * show per-model cost attribution correctly.
 *
 * Per CLAUDE.md → "AI call conventions": 180s timeout, 1 retry on
 * transient errors, prompt caching on system prompts.
 *
 * Large-document handling — proactive chunking:
 *   If text exceeds PROACTIVE_CHUNK_CHARS the pipeline splits the document
 *   before calling Sonnet (not after AI_TRUNCATED). Each completed chunk
 *   fires onChunkProgress so callers can stream real progress to the UI.
 *   For PDFs, text is extracted with pdf-parse first; scanned/image PDFs
 *   that yield too little text fall back to Sonnet's native vision path.
 *   Call 2 (flagging) also chunks proactively on its own threshold.
 */

export interface FlaggedTerm {
  /** The site-specific English term Sonnet flagged. */
  term: string;
  /** Why it was flagged (proper noun, acronym, jargon, etc.) — for the manager UI. */
  reason: string;
  /** Sonnet's first-pass guess at the EN definition. The manager can edit before saving. */
  suggested_definition_en: string;
  /** Sonnet's first-pass guess at the Spanish term. The manager can edit before saving. */
  suggested_term_es: string;
}

export interface SopConversionResult {
  markdown: string;
  flagged_terms: FlaggedTerm[];
  /** Total number of conversion chunks processed (1 = single-call, >1 = chunked). */
  chunks_total: number;
}

/** Progress event emitted after each chunk during a multi-chunk conversion. */
export type ChunkProgressEvent =
  | { type: "chunk_start"; index: number; total: number; label: string }
  | { type: "chunk_done"; index: number; total: number };

// ---------------------------------------------------------------------------
// Call 1 — Sonnet: document → Markdown
// ---------------------------------------------------------------------------

const CONVERSION_SYSTEM_PROMPT = `You are an expert technical writer at OpsFluency, a tool that delivers bilingual SOPs to warehouse and manufacturing workers via QR code. Convert a Standard Operating Procedure document into clean, mobile-friendly Markdown.

Rules:
1. Output JSON only in exactly this shape, no Markdown fences, no commentary:
   {"markdown": "string — the full converted Markdown"}
2. Preserve structure: headings, numbered steps, bullet lists, tables.
3. Convert warning callouts to "> **Warning:**" blockquotes. Same for "> **Caution:**" and "> **Note:**".
4. Keep step numbers as ordered lists ("1. ", "2. ") so the worker reader can format them consistently.
5. Strip page numbers, headers, footers, copyright notices, and revision metadata.
6. Use plain language. Workers read this on a phone in gloves under bad lighting — short sentences win.`;

interface MarkdownOnly {
  markdown: string;
}

function parseMarkdownResponse(rawText: string): MarkdownOnly {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned) as unknown;
  if (typeof parsed !== "object" || parsed === null) throw new Error("Response is not an object");
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.markdown !== "string" || obj.markdown.length === 0) {
    throw new Error("Missing or empty `markdown` field");
  }
  return { markdown: obj.markdown };
}

// ---------------------------------------------------------------------------
// Call 2 — Sonnet: Markdown + glossary → flagged terms
// ---------------------------------------------------------------------------

const SONNET_FLAGGING_SYSTEM_BASE = `You are a bilingual technical reviewer at OpsFluency. You are given a converted SOP in Markdown and must identify site-specific terminology that needs translator attention before English → Spanish translation.

Flag any term that is a proper noun, an acronym, in-house equipment name, or jargon that a generic translator would render incorrectly in Spanish.
Do NOT flag terms already defined in the company glossary below — use those exactly as specified.
Do NOT flag generic English vocabulary, common safety terms, or units of measure.

Output JSON ONLY in exactly this shape, no Markdown fences, no commentary:
{"flagged_terms": [{"term": "string — the English term as it appears","reason": "string — short explanation of why it needs definition","suggested_definition_en": "string — your best guess at a one-sentence definition","suggested_term_es": "string — your best guess at the Spanish equivalent"}]}`;

function renderGlossary(glossary: GlossaryRow[]): string {
  if (glossary.length === 0) {
    return "Company glossary: (empty — flag terms freely)";
  }
  const lines = glossary.map((g) => {
    const def = g.definition_en ? ` — ${g.definition_en}` : "";
    return `- ${g.term_en}${def} → ${g.term_es}`;
  });
  return `Company glossary (already defined — use exactly as specified):\n${lines.join("\n")}`;
}

function buildFlaggingSystemPrompt(glossary: GlossaryRow[]): string {
  return `${SONNET_FLAGGING_SYSTEM_BASE}\n\n${renderGlossary(glossary)}`;
}

interface FlaggedTermsOnly {
  flagged_terms: FlaggedTerm[];
}

function parseFlaggingResponse(rawText: string): FlaggedTermsOnly {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned) as unknown;
  if (typeof parsed !== "object" || parsed === null) throw new Error("Response is not an object");
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.flagged_terms)) throw new Error("`flagged_terms` is not an array");

  const flagged: FlaggedTerm[] = obj.flagged_terms.map((t, i) => {
    if (typeof t !== "object" || t === null) throw new Error(`flagged_terms[${i}] is not an object`);
    const term = t as Record<string, unknown>;
    if (typeof term.term !== "string" || term.term.length === 0) {
      throw new Error(`flagged_terms[${i}].term is invalid`);
    }
    return {
      term: term.term,
      reason: typeof term.reason === "string" ? term.reason : "",
      suggested_definition_en:
        typeof term.suggested_definition_en === "string" ? term.suggested_definition_en : "",
      suggested_term_es:
        typeof term.suggested_term_es === "string" ? term.suggested_term_es : "",
    };
  });

  return { flagged_terms: flagged };
}

// ---------------------------------------------------------------------------
// Chunking helpers
// ---------------------------------------------------------------------------

/**
 * Proactive split threshold for text conversion (Call 1).
 * Documents larger than this are split before sending to Sonnet.
 * Chosen so each chunk generates ≤6 000 output tokens → ~30–40s per chunk.
 * Smaller chunks = shorter individual calls + real progress milestones.
 */
const PROACTIVE_CHUNK_CHARS = 20_000;

/** Reactive fallback: only kicks in if a proactive chunk itself triggers AI_TRUNCATED. */
const CONVERSION_TEXT_CHUNK_MAX_CHARS = 60_000;

/** Flagging (Call 2) — heading-bounded chunks for term identification. */
const FLAGGING_CHUNK_MAX_CHARS = 8_000;

/** Extract a human-readable label from the start of a text/Markdown chunk. */
function extractChunkLabel(text: string, fallbackIndex: number): string {
  const headingMatch = text.match(/^#{1,4}\s+(.+)/m);
  if (headingMatch) return headingMatch[1].trim().slice(0, 60);
  const capsLine = text.match(/^([A-Z][^\n]{10,60})$/m);
  if (capsLine) return capsLine[1].trim().slice(0, 60);
  return `Section ${fallbackIndex + 1}`;
}

/**
 * Splits text at paragraph boundaries, targeting chunks ≤ maxChars.
 * Primary split: H1/H2 headings. Secondary: H3/H4. Fallback: paragraph breaks.
 */
function splitTextProactively(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  function groupByBoundary(parts: string[], max: number): string[] {
    const out: string[] = [];
    let cur = "";
    for (const part of parts) {
      if (cur.length + part.length > max && cur.length > 0) {
        out.push(cur);
        cur = part;
      } else {
        cur += part;
      }
    }
    if (cur.length > 0) out.push(cur);
    return out;
  }

  // Pass 1: H1/H2
  let chunks = groupByBoundary(text.split(/(?=^#{1,2} )/m), maxChars);

  // Pass 2: H3/H4 for any still-oversized chunks
  chunks = chunks.flatMap((c) => {
    if (c.length <= maxChars) return [c];
    return groupByBoundary(c.split(/(?=^#{3,4} )/m), maxChars);
  });

  // Pass 3: paragraph breaks
  chunks = chunks.flatMap((c) => {
    if (c.length <= maxChars) return [c];
    const paras = c.split(/\n\n+/);
    const out: string[] = [];
    let cur = "";
    for (const para of paras) {
      const sep = cur.length > 0 ? "\n\n" : "";
      if (cur.length + sep.length + para.length > maxChars && cur.length > 0) {
        out.push(cur);
        cur = para;
      } else {
        cur = cur + sep + para;
      }
    }
    if (cur.length > 0) out.push(cur);
    return out;
  });

  return chunks.filter((c) => c.trim().length > 0);
}

/**
 * Splits a Markdown string into heading-bounded chunks for per-section term
 * flagging. Split priority: H1/H2 → H3/H4 → paragraph breaks.
 */
function splitMarkdownForFlagging(markdown: string): string[] {
  return splitTextProactively(markdown, FLAGGING_CHUNK_MAX_CHARS);
}

// ---------------------------------------------------------------------------
// Call 2 with automatic chunked fallback
// ---------------------------------------------------------------------------

/**
 * Flags terms in multiple Markdown chunks sequentially, merging and
 * deduplicating results by term (case-insensitive). Sequential to avoid
 * cascading 429s from Anthropic's per-minute token rate limit.
 */
async function flagTermsInChunks(
  chunks: string[],
  glossary: GlossaryRow[],
  ctx: { sopId: string; companyId: string },
  signal?: AbortSignal,
): Promise<SonnetResult<FlaggedTermsOnly>> {
  const systemPrompt = buildFlaggingSystemPrompt(glossary);
  const accumulated: FlaggedTerm[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (const chunk of chunks) {
    const result = await callSonnet<FlaggedTermsOnly>(
      {
        model: SONNET_MODEL,
        systemPrompt,
        userMessage: `Review the following SOP Markdown for site-specific terminology that needs translator attention:\n\n---BEGIN MARKDOWN---\n${chunk}\n---END MARKDOWN---`,
        maxTokens: 8192,
        parse: parseFlaggingResponse,
        signal,
      },
      ctx,
    );

    if (!result.ok) return result;

    for (const term of result.data.flagged_terms) {
      const key = term.term.toLowerCase().trim();
      if (!accumulated.some((t) => t.term.toLowerCase().trim() === key)) {
        accumulated.push(term);
      }
    }

    inputTokens += result.usage.input_tokens;
    outputTokens += result.usage.output_tokens;
  }

  return {
    ok: true,
    data: { flagged_terms: accumulated },
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
  };
}

/**
 * Runs the flagging call on `markdown`. Proactively chunks if markdown
 * exceeds FLAGGING_CHUNK_MAX_CHARS. On AI_TRUNCATED, retries using finer
 * heading-bounded chunks if the Markdown can be split.
 * Transparent to all callers — managers never see AI_TRUNCATED from this step
 * unless even the individual chunks are too large.
 */
async function runFlaggingWithFallback(
  markdown: string,
  glossary: GlossaryRow[],
  ctx: { sopId: string; companyId: string },
  signal?: AbortSignal,
): Promise<SonnetResult<FlaggedTermsOnly>> {
  // Proactively chunk if markdown is large enough to warrant it.
  if (markdown.length > FLAGGING_CHUNK_MAX_CHARS) {
    const chunks = splitMarkdownForFlagging(markdown);
    if (chunks.length > 1) {
      return flagTermsInChunks(chunks, glossary, ctx, signal);
    }
  }

  const result = await callSonnet<FlaggedTermsOnly>(
    {
      model: SONNET_MODEL,
      systemPrompt: buildFlaggingSystemPrompt(glossary),
      userMessage: `Review the following SOP Markdown for site-specific terminology that needs translator attention:\n\n---BEGIN MARKDOWN---\n${markdown}\n---END MARKDOWN---`,
      maxTokens: 8192,
      parse: parseFlaggingResponse,
      signal,
    },
    ctx,
  );

  if (!result.ok && result.error.code === "AI_TRUNCATED") {
    const chunks = splitMarkdownForFlagging(markdown);
    if (chunks.length > 1) {
      return flagTermsInChunks(chunks, glossary, ctx, signal);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Shared pipeline runner (PDF vision and image paths — no proactive chunking)
// ---------------------------------------------------------------------------

interface ConvertSopBaseInput {
  glossary: GlossaryRow[];
  sopId: string;
  companyId: string;
  signal?: AbortSignal;
  onChunkProgress?: (event: ChunkProgressEvent) => void;
}

async function runPipeline(
  base: ConvertSopBaseInput,
  userMessage: SonnetUserContent,
): Promise<SonnetResult<SopConversionResult>> {
  const ctx = { sopId: base.sopId, companyId: base.companyId };

  // Single vision call — no proactive chunking (can't split a PDF/image block).
  base.onChunkProgress?.({ type: "chunk_start", index: 0, total: 1, label: "Document" });

  const conversionResult = await callSonnet<MarkdownOnly>(
    {
      model: SONNET_MODEL,
      systemPrompt: CONVERSION_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 16384,
      parse: parseMarkdownResponse,
      signal: base.signal,
    },
    ctx,
  );

  if (!conversionResult.ok) return conversionResult;

  base.onChunkProgress?.({ type: "chunk_done", index: 0, total: 1 });

  const { markdown } = conversionResult.data;

  const flaggingResult = await runFlaggingWithFallback(
    markdown,
    base.glossary,
    ctx,
    base.signal,
  );

  if (!flaggingResult.ok) return flaggingResult;

  return {
    ok: true,
    data: {
      markdown,
      flagged_terms: flaggingResult.data.flagged_terms,
      chunks_total: 1,
    },
    usage: {
      input_tokens: conversionResult.usage.input_tokens + flaggingResult.usage.input_tokens,
      output_tokens: conversionResult.usage.output_tokens + flaggingResult.usage.output_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// Chunked text conversion (Call 1 — text path, proactive or reactive)
// ---------------------------------------------------------------------------

async function convertTextInChunks(
  base: ConvertSopBaseInput,
  chunks: string[],
  ctx: { sopId: string; companyId: string },
): Promise<SonnetResult<SopConversionResult>> {
  const parts: string[] = [];
  let convInputTokens = 0;
  let convOutputTokens = 0;
  const total = chunks.length;

  for (let i = 0; i < chunks.length; i++) {
    const label = extractChunkLabel(chunks[i], i);
    base.onChunkProgress?.({ type: "chunk_start", index: i, total, label });

    const result = await callSonnet<MarkdownOnly>(
      {
        model: SONNET_MODEL,
        systemPrompt: CONVERSION_SYSTEM_PROMPT,
        userMessage: `Convert the following document section. The original filename and any visible page chrome are noise — focus on the SOP content.\n\n---BEGIN DOCUMENT---\n${chunks[i]}\n---END DOCUMENT---`,
        maxTokens: 16384,
        parse: parseMarkdownResponse,
        signal: base.signal,
      },
      ctx,
    );

    if (!result.ok) return result;

    base.onChunkProgress?.({ type: "chunk_done", index: i, total });
    parts.push(result.data.markdown);
    convInputTokens += result.usage.input_tokens;
    convOutputTokens += result.usage.output_tokens;
  }

  const markdown = parts.join("\n\n---\n\n");
  const flaggingResult = await runFlaggingWithFallback(markdown, base.glossary, ctx, base.signal);
  if (!flaggingResult.ok) return flaggingResult;

  return {
    ok: true,
    data: { markdown, flagged_terms: flaggingResult.data.flagged_terms, chunks_total: total },
    usage: {
      input_tokens: convInputTokens + flaggingResult.usage.input_tokens,
      output_tokens: convOutputTokens + flaggingResult.usage.output_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// Public API — three entry points matching the three upload paths
// ---------------------------------------------------------------------------

export interface ConvertSopFromTextInput extends ConvertSopBaseInput {
  documentText: string;
}

/**
 * Converts a plain-text or text-extracted document into the SOP Markdown shape.
 * Proactively chunks if the document exceeds PROACTIVE_CHUNK_CHARS so the
 * caller receives real per-chunk progress events instead of a single long wait.
 */
export async function convertSopFromText(
  input: ConvertSopFromTextInput,
): Promise<SonnetResult<SopConversionResult>> {
  const ctx = { sopId: input.sopId, companyId: input.companyId };

  // Proactive split — do this before calling Sonnet, not after AI_TRUNCATED.
  const chunks = splitTextProactively(input.documentText, PROACTIVE_CHUNK_CHARS);
  if (chunks.length > 1) {
    return convertTextInChunks(input, chunks, ctx);
  }

  // Single chunk — one Sonnet call with progress bookends.
  input.onChunkProgress?.({ type: "chunk_start", index: 0, total: 1, label: extractChunkLabel(input.documentText, 0) });

  const conversionResult = await callSonnet<MarkdownOnly>(
    {
      model: SONNET_MODEL,
      systemPrompt: CONVERSION_SYSTEM_PROMPT,
      userMessage: `Convert the following document. The original filename and any visible page chrome are noise — focus on the SOP content.\n\n---BEGIN DOCUMENT---\n${input.documentText}\n---END DOCUMENT---`,
      maxTokens: 16384,
      parse: parseMarkdownResponse,
      signal: input.signal,
    },
    ctx,
  );

  if (!conversionResult.ok) {
    // Reactive fallback: if even the single chunk is too big, split at
    // paragraph boundaries and retry — keeps AI_TRUNCATED off the manager UI.
    if (conversionResult.error.code === "AI_TRUNCATED") {
      const reactiveChunks = splitTextProactively(input.documentText, CONVERSION_TEXT_CHUNK_MAX_CHARS);
      if (reactiveChunks.length > 1) {
        return convertTextInChunks(input, reactiveChunks, ctx);
      }
    }
    return conversionResult;
  }

  input.onChunkProgress?.({ type: "chunk_done", index: 0, total: 1 });

  const { markdown } = conversionResult.data;
  const flaggingResult = await runFlaggingWithFallback(markdown, input.glossary, ctx, input.signal);
  if (!flaggingResult.ok) return flaggingResult;

  return {
    ok: true,
    data: { markdown, flagged_terms: flaggingResult.data.flagged_terms, chunks_total: 1 },
    usage: {
      input_tokens: conversionResult.usage.input_tokens + flaggingResult.usage.input_tokens,
      output_tokens: conversionResult.usage.output_tokens + flaggingResult.usage.output_tokens,
    },
  };
}

export interface ConvertSopFromPdfInput extends ConvertSopBaseInput {
  pdfBase64: string;
  /** Raw PDF bytes — used to attempt text extraction before the vision path. */
  pdfBuffer?: Buffer;
}

/**
 * Converts a PDF document into the SOP Markdown shape.
 *
 * First attempts to extract machine-readable text via pdf-parse:
 *   - If extraction succeeds (typed PDF): routes to convertSopFromText so the
 *     document benefits from proactive chunking and real per-chunk progress.
 *   - If extraction fails or yields < 500 chars (scanned/image PDF): falls back
 *     to Anthropic's native document block — Sonnet reads the PDF as a file
 *     via vision, which handles both digital-text and scanned layouts.
 */
export async function convertSopFromPdf(
  input: ConvertSopFromPdfInput,
): Promise<SonnetResult<SopConversionResult>> {
  if (input.pdfBuffer) {
    const extracted = await extractPdfText(input.pdfBuffer);
    if (extracted) {
      return convertSopFromText({
        documentText: extracted.text,
        glossary: input.glossary,
        sopId: input.sopId,
        companyId: input.companyId,
        signal: input.signal,
        onChunkProgress: input.onChunkProgress,
      });
    }
  }

  // Scanned or buffer not provided — use Sonnet's native vision path.
  const userMessage: SonnetUserContent = [
    {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: input.pdfBase64,
      },
    },
    {
      type: "text",
      text: "Convert the SOP in this PDF. Strip page chrome (headers/footers/page numbers/revision metadata) and produce the JSON output described in the system prompt.",
    },
  ];
  return runPipeline(input, userMessage);
}

export interface ConvertSopFromImageInput extends ConvertSopBaseInput {
  imageBase64: string;
  mimeType: string;
}

/**
 * Converts a photo of a printed/laminated SOP into the SOP Markdown shape.
 * Used when a manager uploads a JPG/PNG/HEIC of a wall poster instead of a
 * digital document. Vision capabilities handle OCR and layout inference.
 */
export async function convertSopFromImage(
  input: ConvertSopFromImageInput,
): Promise<SonnetResult<SopConversionResult>> {
  const userMessage: SonnetUserContent = [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: input.mimeType,
        data: input.imageBase64,
      },
    },
    {
      type: "text",
      text: "Convert the SOP shown in this image. Read all text in the image, infer document structure (headings, steps, warnings), and produce the same JSON output format as for text input.",
    },
  ];
  return runPipeline(input, userMessage);
}

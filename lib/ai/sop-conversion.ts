import "server-only";

import { callSonnet, type SonnetResult, type SonnetUserContent } from "./sonnet";

/**
 * SOP conversion via Claude Sonnet.
 *
 * Per CLAUDE.md → "SOP Conversion -- Sonnet Prompt Pattern":
 * - inject the full company glossary as already-defined vocabulary
 * - return both structured Markdown and a list of site-specific terms
 * - use a JSON-only output shape so the caller can parse safely
 *
 * Vision input (image MIME types) is sent as a single user message with one
 * `image` block followed by an instruction text block. Text input is sent as
 * a plain string. Either path produces the same output shape.
 *
 * Sonnet, never Haiku — quality of the markdown is what every downstream
 * step (translation, worker reader) inherits.
 */

export interface GlossaryRow {
  term_en: string;
  definition_en: string | null;
  term_es: string;
  definition_es: string | null;
}

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
}

const SYSTEM_PROMPT_BASE = `You are an expert technical writer at OpsFluency, a tool that delivers bilingual SOPs to warehouse and manufacturing workers via QR code. Your job is to convert an existing Standard Operating Procedure into clean, mobile-friendly Markdown and surface site-specific terminology that needs translator attention.

Rules:
1. Output Markdown only — no HTML, no preamble, no closing remarks.
2. Preserve structure: headings, numbered steps, bullet lists, tables.
3. Convert warning callouts to "> **Warning:**" blockquotes. Do the same for "> **Caution:**" and "> **Note:**".
4. Keep step numbers as ordered lists ("1. ", "2. ") so the worker reader can format them consistently.
5. Strip page numbers, headers, footers, copyright notices, and revision metadata that don't help a worker doing the procedure.
6. Use plain language. Workers read this on a phone in gloves under bad lighting; short sentences win.

Flagging site-specific terms:
- Flag any term that is a proper noun, an acronym, a piece of equipment named in-house, or jargon that a generic translator would render incorrectly in Spanish.
- Do NOT flag terms that are already defined in the company glossary below — use those exactly as specified.
- Do NOT flag generic English vocabulary, common safety terms, or units of measure.

Output JSON ONLY in exactly this shape, no Markdown fences, no commentary:
{
  "markdown": "string — the converted Markdown",
  "flagged_terms": [
    {
      "term": "string — the English term as it appears",
      "reason": "string — short explanation of why it needs definition",
      "suggested_definition_en": "string — your best guess at a one-sentence definition",
      "suggested_term_es": "string — your best guess at the Spanish equivalent"
    }
  ]
}`;

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

function buildSystemPrompt(glossary: GlossaryRow[]): string {
  return `${SYSTEM_PROMPT_BASE}\n\n${renderGlossary(glossary)}`;
}

function parseConversionResponse(rawText: string): SopConversionResult {
  // Strip markdown code fences in case Sonnet wraps the JSON despite instructions.
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed = JSON.parse(cleaned) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Response is not an object");
  }
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.markdown !== "string" || obj.markdown.length === 0) {
    throw new Error("Missing or empty `markdown` field");
  }
  if (!Array.isArray(obj.flagged_terms)) {
    throw new Error("`flagged_terms` is not an array");
  }

  const flagged: FlaggedTerm[] = obj.flagged_terms.map((t, i) => {
    if (typeof t !== "object" || t === null) {
      throw new Error(`flagged_terms[${i}] is not an object`);
    }
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

  return { markdown: obj.markdown, flagged_terms: flagged };
}

interface ConvertSopBaseInput {
  glossary: GlossaryRow[];
  sopId: string;
  companyId: string;
  signal?: AbortSignal;
}

export interface ConvertSopFromTextInput extends ConvertSopBaseInput {
  documentText: string;
}

/**
 * Converts a plain-text or text-extracted document (PDF/DOCX/TXT) into the
 * SOP Markdown shape. The caller is responsible for extracting text from the
 * source file before calling this — Anthropic does not parse PDFs natively
 * outside of the vision path.
 */
export async function convertSopFromText(
  input: ConvertSopFromTextInput,
): Promise<SonnetResult<SopConversionResult>> {
  const userMessage = `Convert the following document. The original filename and any visible page chrome are noise — focus on the SOP content.\n\n---BEGIN DOCUMENT---\n${input.documentText}\n---END DOCUMENT---`;

  return callSonnet<SopConversionResult>(
    {
      systemPrompt: buildSystemPrompt(input.glossary),
      userMessage,
      maxTokens: 4096,
      parse: parseConversionResponse,
      signal: input.signal,
    },
    { sopId: input.sopId, companyId: input.companyId },
  );
}

export interface ConvertSopFromPdfInput extends ConvertSopBaseInput {
  pdfBase64: string;
}

/**
 * Converts a PDF document into the SOP Markdown shape using Sonnet's native
 * document block — no PDF parsing library needed. Sonnet handles both
 * digital-text PDFs and scanned (image-only) PDFs in a single call.
 */
export async function convertSopFromPdf(
  input: ConvertSopFromPdfInput,
): Promise<SonnetResult<SopConversionResult>> {
  const content: SonnetUserContent = [
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

  return callSonnet<SopConversionResult>(
    {
      systemPrompt: buildSystemPrompt(input.glossary),
      userMessage: content,
      maxTokens: 4096,
      parse: parseConversionResponse,
      signal: input.signal,
    },
    { sopId: input.sopId, companyId: input.companyId },
  );
}

export interface ConvertSopFromImageInput extends ConvertSopBaseInput {
  imageBase64: string;
  mimeType: string;
}

/**
 * Converts a photo of a printed/laminated SOP into the SOP Markdown shape.
 * Used when a manager uploads a JPG/PNG/HEIC of a wall poster instead of a
 * digital document. Sonnet's vision capabilities handle the OCR and layout
 * inference in a single call — no separate OCR service needed.
 */
export async function convertSopFromImage(
  input: ConvertSopFromImageInput,
): Promise<SonnetResult<SopConversionResult>> {
  const content: SonnetUserContent = [
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

  return callSonnet<SopConversionResult>(
    {
      systemPrompt: buildSystemPrompt(input.glossary),
      userMessage: content,
      maxTokens: 4096,
      parse: parseConversionResponse,
      signal: input.signal,
    },
    { sopId: input.sopId, companyId: input.companyId },
  );
}

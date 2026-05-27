import 'server-only';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { Node } from 'unist';

import { getAdminClient } from '@/lib/supabase/admin';
import type { GlossaryRow } from '@/lib/types/glossary';
import { GOOGLE_TRANSLATE_MODEL } from './google';
import { isQualifiedForTM, lookupTM, saveTM, sha256, type TmEntry } from './memory';

/**
 * Structure-preserving Markdown translator.
 *
 * Sending Markdown wholesale to Google Translate corrupts the structural
 * scaffolding — table separator rows (`|---|---|`) get stripped or
 * mangled, fenced delimiters drift, horizontal rules disappear. Once
 * those bytes are damaged the renderer can't recover the table.
 *
 * This module sidesteps the problem by translating only the *text leaves*
 * of the parsed mdast tree:
 *
 *   1. Parse English Markdown → mdast (remark-parse + remark-gfm).
 *   2. Walk the tree, collecting every `text` node's value (and a few
 *      other text-bearing fields — image alt, link title) plus every
 *      glossary token's English form for placeholder substitution.
 *   3. Send those strings to Google Translate v2 as `q[]` so each leaf
 *      stays separate. Google never sees pipes, fence delimiters,
 *      heading hashes — there's nothing structural to break.
 *   4. Walk the tree again and replace each leaf with its translation.
 *   5. Re-stringify with remark-stringify + remark-gfm → Spanish
 *      Markdown that's structurally identical to the source.
 *
 * Glossary placeholders are still applied per-leaf (XGLO0X, XGLO1X, …)
 * so site-specific terms round-trip exactly — same trick as
 * `lib/translation/google.ts` but scoped to the leaf, not the document.
 */

const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 1;
// Google Translate v2 rejects requests with more than 128 segments.
const SEGMENT_BATCH_SIZE = 128;

export type TranslationErrorCode =
  | 'TRANSLATION_TIMEOUT'
  | 'TRANSLATION_RATE_LIMITED'
  | 'TRANSLATION_CONFIG_ERROR'
  | 'TRANSLATION_INTERNAL';

export interface TranslationSuccess {
  ok: true;
  translated: string;
}

export interface TranslationFailure {
  ok: false;
  error: {
    code: TranslationErrorCode;
    retry_allowed: boolean;
    message?: string;
    duration_ms?: number;
    attempt?: number;
    http_status?: number;
    raw?: string;
  };
}

export type TranslationResult = TranslationSuccess | TranslationFailure;

export interface TranslateMarkdownStructuredInput {
  markdown: string;
  source: 'en';
  target: 'es';
  glossary: GlossaryRow[];
  signal?: AbortSignal;
  sopId?: string | null;
  companyId?: string | null;
}

interface PlaceholderEntry {
  placeholder: string;
  term_es: string;
}

function buildPlaceholderMap(glossary: GlossaryRow[]): {
  byLower: Map<string, PlaceholderEntry>;
  pattern: RegExp | null;
} {
  if (glossary.length === 0) return { byLower: new Map(), pattern: null };

  const byLower = new Map<string, PlaceholderEntry>();
  glossary.forEach((row, i) => {
    const placeholder = `XGLO${i}X`;
    byLower.set(row.term_en.toLowerCase(), { placeholder, term_es: row.term_es });
  });

  const sorted = Array.from(byLower.keys()).sort((a, b) => b.length - a.length);
  const escaped = sorted.map((t) => t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  return { byLower, pattern };
}

function substituteIn(s: string, byLower: Map<string, PlaceholderEntry>, pattern: RegExp): string {
  return s.replace(pattern, (m) => byLower.get(m.toLowerCase())?.placeholder ?? m);
}

function restoreIn(s: string, byLower: Map<string, PlaceholderEntry>): string {
  if (byLower.size === 0) return s;
  let out = s;
  for (const e of byLower.values()) {
    out = out.split(e.placeholder).join(e.term_es);
  }
  return out;
}

// ── mdast leaf collection ──────────────────────────────────────────────────────
//
// The tree carries text in a handful of places. We collect a list of
// "slots" — each slot owns a getter and a setter for a string of text
// — so the visit pass can operate uniformly on text/imageAlt/linkTitle
// without special-casing per node type at translate time.

interface TextSlot {
  get: () => string;
  set: (v: string) => void;
}

function collectTextSlots(tree: Root): TextSlot[] {
  const slots: TextSlot[] = [];

  visit(tree, (node: Node) => {
    // Plain text nodes inside paragraphs, list items, table cells,
    // headings, blockquotes — anywhere remark parses prose.
    if (node.type === 'text') {
      const n = node as Node & { value: string };
      slots.push({ get: () => n.value, set: (v) => (n.value = v) });
    }

    // image.alt and image.title are user-facing and worth translating.
    // image.url is not.
    if (node.type === 'image') {
      const n = node as Node & { alt?: string | null; title?: string | null };
      if (typeof n.alt === 'string' && n.alt.length > 0) {
        slots.push({ get: () => n.alt as string, set: (v) => (n.alt = v) });
      }
      if (typeof n.title === 'string' && n.title.length > 0) {
        slots.push({ get: () => n.title as string, set: (v) => (n.title = v) });
      }
    }

    // link.title (the tooltip) gets translated; link.url does not.
    if (node.type === 'link') {
      const n = node as Node & { title?: string | null };
      if (typeof n.title === 'string' && n.title.length > 0) {
        slots.push({ get: () => n.title as string, set: (v) => (n.title = v) });
      }
    }

    // Intentionally NOT collected:
    //   inlineCode / code  → code stays in source language
    //   html               → raw HTML; structure-fragile, leave alone
    //   yaml / toml        → frontmatter; structural metadata
    //   definition / footnoteReference / link.url → identifiers
  });

  return slots;
}

// ── Google call ────────────────────────────────────────────────────────────────

interface GoogleCallResult {
  ok: boolean;
  status: number;
  text: string;
}

async function callTranslateBatch(
  apiKey: string,
  q: string[],
  source: string,
  target: string,
  signal: AbortSignal,
): Promise<GoogleCallResult> {
  const url = `${TRANSLATE_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
  // Google v2 accepts q as a repeated parameter or an array in JSON body.
  // Sending one request with an array preserves order in `data.translations`.
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q, source, target, format: 'text' }),
    signal,
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

function extractTranslatedTexts(parsed: unknown): string[] | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const data = (parsed as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;
  const translations = (data as { translations?: unknown }).translations;
  if (!Array.isArray(translations)) return null;
  const out: string[] = [];
  for (const t of translations) {
    if (typeof t !== 'object' || t === null) return null;
    const txt = (t as { translatedText?: unknown }).translatedText;
    if (typeof txt !== 'string') return null;
    out.push(txt);
  }
  return out;
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(signals);
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener('abort', () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Telemetry ──────────────────────────────────────────────────────────────────

interface LogTranslateInput {
  sopId: string | null | undefined;
  companyId: string | null | undefined;
  /** Characters actually sent to Google (excludes TM hits). */
  inputChars: number;
  outputChars: number;
  durationMs: number;
  /** Text segments served from translation_memory cache (not billed). */
  tmHits: number;
}

async function logTranslateCall({
  sopId,
  companyId,
  inputChars,
  outputChars,
  durationMs,
  tmHits,
}: LogTranslateInput): Promise<void> {
  try {
    const supabase = getAdminClient();
    await supabase.from('ai_call_log').insert({
      model: GOOGLE_TRANSLATE_MODEL,
      input_units: inputChars,
      output_units: outputChars,
      unit_kind: 'character',
      sop_id: sopId ?? null,
      company_id: companyId ?? null,
      duration_ms: durationMs,
      tm_hits: tmHits,
    });
  } catch {
    // Never block on telemetry.
  }
}

// ── Batching helpers ───────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

/**
 * Translate one chunk of ≤128 segments with the standard retry loop.
 * Returns the translated strings on success or a `TranslationFailure` on error.
 */
async function translateChunkWithRetry(
  apiKey: string,
  chunk: string[],
  source: string,
  target: string,
  callerSignal: AbortSignal | undefined,
  startMs: number,
): Promise<{ ok: true; results: string[] } | TranslationFailure> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const signal = callerSignal ? anySignal([callerSignal, controller.signal]) : controller.signal;

    try {
      const res = await callTranslateBatch(apiKey, chunk, source, target, signal);

      if (res.ok) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(res.text);
        } catch {
          return {
            ok: false,
            error: {
              code: 'TRANSLATION_INTERNAL',
              retry_allowed: false,
              message: 'Invalid JSON from Google Translate',
              duration_ms: Date.now() - startMs,
              attempt: attempt + 1,
              http_status: res.status,
              raw: res.text.slice(0, 2048),
            },
          };
        }
        const got = extractTranslatedTexts(parsed);
        if (!got || got.length !== chunk.length) {
          return {
            ok: false,
            error: {
              code: 'TRANSLATION_INTERNAL',
              retry_allowed: false,
              message: `Expected ${chunk.length} translations, got ${got?.length ?? 0}`,
              duration_ms: Date.now() - startMs,
              attempt: attempt + 1,
              http_status: res.status,
              raw: res.text.slice(0, 2048),
            },
          };
        }
        return { ok: true, results: got };
      }

      if (res.status === 429) {
        if (attempt < MAX_RETRIES) { await sleep(500 + Math.floor(Math.random() * 1000)); continue; }
        return { ok: false, error: { code: 'TRANSLATION_RATE_LIMITED', retry_allowed: true, message: 'Google Translate 429', duration_ms: Date.now() - startMs, attempt: attempt + 1, http_status: 429, raw: res.text.slice(0, 2048) } };
      }
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(500 + Math.floor(Math.random() * 1000)); continue;
      }
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return { ok: false, error: { code: 'TRANSLATION_CONFIG_ERROR', retry_allowed: false, message: `Google Translate ${res.status}`, duration_ms: Date.now() - startMs, attempt: attempt + 1, http_status: res.status, raw: res.text.slice(0, 2048) } };
      }
      return { ok: false, error: { code: 'TRANSLATION_INTERNAL', retry_allowed: false, message: `Google Translate ${res.status}`, duration_ms: Date.now() - startMs, attempt: attempt + 1, http_status: res.status, raw: res.text.slice(0, 2048) } };
    } catch (err) {
      if (controller.signal.aborted && !callerSignal?.aborted) {
        return { ok: false, error: { code: 'TRANSLATION_TIMEOUT', retry_allowed: true, message: `Google Translate did not respond within ${DEFAULT_TIMEOUT_MS / 1000}s`, duration_ms: Date.now() - startMs, attempt: attempt + 1 } };
      }
      if (attempt < MAX_RETRIES) { await sleep(500 + Math.floor(Math.random() * 1000)); continue; }
      return { ok: false, error: { code: 'TRANSLATION_INTERNAL', retry_allowed: false, message: err instanceof Error ? err.message : String(err), duration_ms: Date.now() - startMs, attempt: attempt + 1 } };
    } finally {
      clearTimeout(timeout);
    }
  }
  return { ok: false, error: { code: 'TRANSLATION_INTERNAL', retry_allowed: false, message: 'Exhausted retries', duration_ms: Date.now() - startMs, attempt: MAX_RETRIES + 1 } };
}

// ── Public entry point ─────────────────────────────────────────────────────────

export async function translateMarkdownStructured(
  input: TranslateMarkdownStructuredInput,
): Promise<TranslationResult> {
  const start = Date.now();
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: 'TRANSLATION_CONFIG_ERROR',
        retry_allowed: false,
        message: 'GOOGLE_CLOUD_TRANSLATION_API_KEY is not set',
        duration_ms: 0,
        attempt: 1,
      },
    };
  }

  // 1. Parse to mdast.
  let tree: Root;
  try {
    tree = unified().use(remarkParse).use(remarkGfm).parse(input.markdown) as Root;
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'TRANSLATION_INTERNAL',
        retry_allowed: false,
        message: err instanceof Error ? `mdast parse failed: ${err.message}` : 'mdast parse failed',
        duration_ms: Date.now() - start,
        attempt: 1,
      },
    };
  }

  // 2. Collect leaves + snapshot original English texts before any mutation.
  const slots = collectTextSlots(tree);
  const originalTexts = slots.map((s) => s.get());

  if (slots.length === 0) {
    // Nothing to translate (e.g., a doc that's only code/HTML).
    const out = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkStringify)
      .stringify(tree);
    return { ok: true, translated: typeof out === 'string' ? out : input.markdown };
  }

  // 3. TM lookup: check qualifying leaves against the company cache.
  //    A hit applies the stored translation directly — no Google call for that leaf.
  const tmHitIndices = new Set<number>();
  if (input.companyId) {
    const qualifiedPairs: Array<{ slotIndex: number; hash: string }> = [];
    for (let i = 0; i < slots.length; i++) {
      if (isQualifiedForTM(originalTexts[i])) {
        qualifiedPairs.push({ slotIndex: i, hash: sha256(originalTexts[i]) });
      }
    }
    if (qualifiedPairs.length > 0) {
      const hashes = qualifiedPairs.map((p) => p.hash);
      const tmHits = await lookupTM(input.companyId, hashes, input.target);
      for (const { slotIndex, hash } of qualifiedPairs) {
        const hit = tmHits.get(hash);
        if (hit !== undefined) {
          slots[slotIndex].set(hit);
          tmHitIndices.add(slotIndex);
        }
      }
    }
  }

  // 4. Determine which slots still need Google.
  const pendingIndices: number[] = [];
  for (let i = 0; i < slots.length; i++) {
    if (!tmHitIndices.has(i)) pendingIndices.push(i);
  }

  // Helper: stringify the tree (TM hits already applied to slots).
  function stringifyTree(): TranslationResult {
    try {
      const stringified = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkStringify)
        .stringify(tree);
      return { ok: true, translated: typeof stringified === 'string' ? stringified : '' };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: 'TRANSLATION_INTERNAL',
          retry_allowed: false,
          message: err instanceof Error ? `mdast stringify failed: ${err.message}` : 'mdast stringify failed',
          duration_ms: Date.now() - start,
          attempt: MAX_RETRIES + 1,
        },
      };
    }
  }

  // Full TM hit — no Google call at all.
  if (pendingIndices.length === 0) {
    await logTranslateCall({
      sopId: input.sopId,
      companyId: input.companyId,
      inputChars: 0,
      outputChars: 0,
      durationMs: Date.now() - start,
      tmHits: tmHitIndices.size,
    });
    return stringifyTree();
  }

  // 5. Apply glossary substitution to pending leaves only.
  const { byLower, pattern } = buildPlaceholderMap(input.glossary);
  const pendingSubstituted = pendingIndices.map((i) =>
    pattern ? substituteIn(originalTexts[i], byLower, pattern) : originalTexts[i],
  );

  // 6. Send pending leaves to Google in batches of ≤128 segments.
  const chunks = chunkArray(pendingSubstituted, SEGMENT_BATCH_SIZE);
  const translatedPending: string[] = [];
  for (const chunk of chunks) {
    const result = await translateChunkWithRetry(
      apiKey, chunk, input.source, input.target, input.signal, start,
    );
    if (!result.ok) return result;
    translatedPending.push(...result.results);
  }

  // 7. Restore glossary placeholders + write Google translations back to tree.
  for (let j = 0; j < pendingIndices.length; j++) {
    slots[pendingIndices[j]].set(restoreIn(translatedPending[j], byLower));
  }

  // 8. Save new translations to TM (fire-and-forget, best-effort).
  if (input.companyId) {
    const entries: TmEntry[] = [];
    for (let j = 0; j < pendingIndices.length; j++) {
      const idx = pendingIndices[j];
      if (isQualifiedForTM(originalTexts[idx])) {
        entries.push({
          sourceText: originalTexts[idx],
          translatedText: restoreIn(translatedPending[j], byLower),
        });
      }
    }
    void saveTM(input.companyId, entries, input.target);
  }

  // 9. Stringify and log.
  const googleChars = pendingIndices.reduce((sum, idx) => sum + originalTexts[idx].length, 0);
  await logTranslateCall({
    sopId: input.sopId,
    companyId: input.companyId,
    inputChars: googleChars,   // actual chars billed by Google (excludes TM hits)
    outputChars: 0,
    durationMs: Date.now() - start,
    tmHits: tmHitIndices.size,
  });

  return stringifyTree();
}

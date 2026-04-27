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
  inputChars: number;
  outputChars: number;
  durationMs: number;
}

async function logTranslateCall({
  sopId,
  companyId,
  inputChars,
  outputChars,
  durationMs,
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
    });
  } catch {
    // Never block on telemetry.
  }
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

  // 2. Collect leaves.
  const slots = collectTextSlots(tree);
  if (slots.length === 0) {
    // Nothing to translate (e.g., a doc that's only code/HTML). Just
    // re-emit the source so the caller doesn't have to special-case.
    const out = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkStringify)
      .stringify(tree);
    return { ok: true, translated: typeof out === 'string' ? out : input.markdown };
  }

  // 3. Apply glossary substitution per leaf.
  const { byLower, pattern } = buildPlaceholderMap(input.glossary);
  const englishLeaves = slots.map((s) =>
    pattern ? substituteIn(s.get(), byLower, pattern) : s.get(),
  );

  // 4. Send leaves to Google as a batch (one request, ordered response).
  let translated: string[] = [];
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const signal = input.signal ? anySignal([input.signal, controller.signal]) : controller.signal;

    try {
      const res = await callTranslateBatch(apiKey, englishLeaves, input.source, input.target, signal);

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
              duration_ms: Date.now() - start,
              attempt: attempt + 1,
              http_status: res.status,
              raw: res.text.slice(0, 2048),
            },
          };
        }
        const got = extractTranslatedTexts(parsed);
        if (!got || got.length !== englishLeaves.length) {
          return {
            ok: false,
            error: {
              code: 'TRANSLATION_INTERNAL',
              retry_allowed: false,
              message: `Expected ${englishLeaves.length} translations, got ${got?.length ?? 0}`,
              duration_ms: Date.now() - start,
              attempt: attempt + 1,
              http_status: res.status,
              raw: res.text.slice(0, 2048),
            },
          };
        }
        translated = got;
        break;
      }

      // Non-2xx
      if (res.status === 429) {
        if (attempt < MAX_RETRIES) {
          await sleep(500 + Math.floor(Math.random() * 1000));
          continue;
        }
        return {
          ok: false,
          error: {
            code: 'TRANSLATION_RATE_LIMITED',
            retry_allowed: true,
            message: 'Google Translate 429',
            duration_ms: Date.now() - start,
            attempt: attempt + 1,
            http_status: 429,
            raw: res.text.slice(0, 2048),
          },
        };
      }
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(500 + Math.floor(Math.random() * 1000));
        continue;
      }
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error: {
            code: 'TRANSLATION_CONFIG_ERROR',
            retry_allowed: false,
            message: `Google Translate ${res.status}`,
            duration_ms: Date.now() - start,
            attempt: attempt + 1,
            http_status: res.status,
            raw: res.text.slice(0, 2048),
          },
        };
      }
      return {
        ok: false,
        error: {
          code: 'TRANSLATION_INTERNAL',
          retry_allowed: false,
          message: `Google Translate ${res.status}`,
          duration_ms: Date.now() - start,
          attempt: attempt + 1,
          http_status: res.status,
          raw: res.text.slice(0, 2048),
        },
      };
    } catch (err) {
      if (controller.signal.aborted && !input.signal?.aborted) {
        return {
          ok: false,
          error: {
            code: 'TRANSLATION_TIMEOUT',
            retry_allowed: true,
            message: `Google Translate did not respond within ${DEFAULT_TIMEOUT_MS / 1000}s`,
            duration_ms: Date.now() - start,
            attempt: attempt + 1,
          },
        };
      }
      if (attempt < MAX_RETRIES) {
        await sleep(500 + Math.floor(Math.random() * 1000));
        continue;
      }
      return {
        ok: false,
        error: {
          code: 'TRANSLATION_INTERNAL',
          retry_allowed: false,
          message: err instanceof Error ? err.message : String(err),
          duration_ms: Date.now() - start,
          attempt: attempt + 1,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  // 5. Restore glossary placeholders + write translations back to the tree.
  for (let i = 0; i < slots.length; i++) {
    const restored = restoreIn(translated[i], byLower);
    slots[i].set(restored);
  }

  // 6. Stringify back to Markdown. remark-gfm here means GFM features
  //    (tables, task lists, strikethrough) emit valid GFM syntax — same
  //    shape the renderer reads with the same plugin.
  let out: string;
  try {
    const stringified = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkStringify)
      .stringify(tree);
    out = typeof stringified === 'string' ? stringified : '';
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

  await logTranslateCall({
    sopId: input.sopId,
    companyId: input.companyId,
    // Source character count is what Google bills against: the
    // original markdown the caller sent in. Counting joined leaves
    // would understate (we don't bill for structural scaffolding,
    // but the markdown the manager edited is the right reference).
    inputChars: input.markdown.length,
    outputChars: out.length,
    durationMs: Date.now() - start,
  });

  return { ok: true, translated: out };
}

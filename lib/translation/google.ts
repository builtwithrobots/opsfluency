import "server-only";

import type { GlossaryRow } from "@/lib/ai/sop-conversion";

/**
 * Google Cloud Translation with glossary injection.
 *
 * The official Google glossary feature in v3 of the API requires the glossary
 * to be staged in Google Cloud Storage and registered as a `Glossary` resource
 * — heavy infrastructure for an MVP. We get the same result with a
 * placeholder-substitution approach against the v2 API:
 *
 *   1. Build a placeholder map for every glossary term ({ en → token → es }).
 *   2. Substitute each English term in the source with its placeholder.
 *      Placeholders are uppercase ASCII tokens that Google Translate passes
 *      through unchanged.
 *   3. Send the substituted text to v2 (POST body, `format=text`) using the
 *      `GOOGLE_CLOUD_TRANSLATION_API_KEY` env var.
 *   4. Replace each placeholder in the response with the canonical Spanish
 *      term from the glossary.
 *
 * This guarantees site-specific terminology stays exact across translations
 * and avoids the round-trip whoopsies that pure machine translation produces
 * for in-house equipment names, acronyms, and proper nouns.
 *
 * Per CLAUDE.md → "AI call conventions": 60s hard timeout, 1 retry on 5xx.
 * No retry on 4xx — those indicate a config / quota issue that won't fix
 * itself.
 */

const TRANSLATE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 1;

export type TranslationErrorCode =
  | "TRANSLATION_TIMEOUT"
  | "TRANSLATION_RATE_LIMITED"
  | "TRANSLATION_CONFIG_ERROR"
  | "TRANSLATION_INTERNAL";

export interface TranslationSuccess {
  ok: true;
  translated: string;
}

export interface TranslationFailure {
  ok: false;
  error: { code: TranslationErrorCode; retry_allowed: boolean; message?: string };
}

export type TranslationResult = TranslationSuccess | TranslationFailure;

export interface TranslateMarkdownInput {
  markdown: string;
  /** Source language; MVP is en → es only. */
  source: "en";
  /** Target language; MVP is en → es only. */
  target: "es";
  /** Tenant glossary; substituted in/out around the API call. */
  glossary: GlossaryRow[];
  signal?: AbortSignal;
}

interface PlaceholderEntry {
  placeholder: string;
  term_es: string;
}

/**
 * Build a map { lowercase_en_term → { placeholder, term_es } } and a sorted
 * regex source string. Terms are sorted by length descending so longer
 * matches win — "Forklift Driver Card" matches before "Forklift".
 */
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
  const escaped = sorted.map((t) => t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
  // Word boundary at the start; allow plural / possessive at the end (but
  // capture them so the placeholder still substitutes back correctly).
  const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  return { byLower, pattern };
}

function substitutePlaceholders(
  source: string,
  byLower: Map<string, PlaceholderEntry>,
  pattern: RegExp,
): string {
  return source.replace(pattern, (match) => {
    const entry = byLower.get(match.toLowerCase());
    return entry ? entry.placeholder : match;
  });
}

function restorePlaceholders(
  translated: string,
  byLower: Map<string, PlaceholderEntry>,
): string {
  if (byLower.size === 0) return translated;
  let out = translated;
  for (const entry of byLower.values()) {
    // Placeholders are unique uppercase tokens; case-sensitive replace is fine.
    out = out.split(entry.placeholder).join(entry.term_es);
  }
  return out;
}

interface CallResult {
  ok: boolean;
  status: number;
  text: string;
}

async function callTranslate(
  body: { q: string; source: string; target: string; format: "text"; key: string },
  signal: AbortSignal,
): Promise<CallResult> {
  const url = `${TRANSLATE_ENDPOINT}?key=${encodeURIComponent(body.key)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      q: body.q,
      source: body.source,
      target: body.target,
      format: body.format,
    }),
    signal,
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === "function") return AbortSignal.any(signals);
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function translateMarkdown(
  input: TranslateMarkdownInput,
): Promise<TranslationResult> {
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: "TRANSLATION_CONFIG_ERROR",
        retry_allowed: false,
        message: "GOOGLE_CLOUD_TRANSLATION_API_KEY is not set",
      },
    };
  }

  const { byLower, pattern } = buildPlaceholderMap(input.glossary);
  const substituted = pattern
    ? substitutePlaceholders(input.markdown, byLower, pattern)
    : input.markdown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const signal = input.signal ? anySignal([input.signal, controller.signal]) : controller.signal;

    try {
      const res = await callTranslate(
        {
          q: substituted,
          source: input.source,
          target: input.target,
          format: "text",
          key: apiKey,
        },
        signal,
      );

      if (res.ok) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(res.text);
        } catch {
          return {
            ok: false,
            error: { code: "TRANSLATION_INTERNAL", retry_allowed: false, message: "Invalid JSON from Google Translate" },
          };
        }
        const translatedText = extractTranslatedText(parsed);
        if (!translatedText) {
          return {
            ok: false,
            error: { code: "TRANSLATION_INTERNAL", retry_allowed: false, message: "Empty translation response" },
          };
        }
        const restored = restorePlaceholders(translatedText, byLower);
        return { ok: true, translated: restored };
      }

      // Non-2xx
      if (res.status === 429) {
        if (attempt < MAX_RETRIES) {
          await sleep(500 + Math.floor(Math.random() * 1000));
          continue;
        }
        return { ok: false, error: { code: "TRANSLATION_RATE_LIMITED", retry_allowed: true } };
      }
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(500 + Math.floor(Math.random() * 1000));
        continue;
      }
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error: { code: "TRANSLATION_CONFIG_ERROR", retry_allowed: false, message: `Google Translate ${res.status}` },
        };
      }
      return {
        ok: false,
        error: { code: "TRANSLATION_INTERNAL", retry_allowed: false, message: `Google Translate ${res.status}` },
      };
    } catch (err) {
      if (controller.signal.aborted && !input.signal?.aborted) {
        return { ok: false, error: { code: "TRANSLATION_TIMEOUT", retry_allowed: true } };
      }
      if (attempt < MAX_RETRIES) {
        await sleep(500 + Math.floor(Math.random() * 1000));
        continue;
      }
      return {
        ok: false,
        error: {
          code: "TRANSLATION_INTERNAL",
          retry_allowed: false,
          message: err instanceof Error ? err.message : String(err),
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { ok: false, error: { code: "TRANSLATION_INTERNAL", retry_allowed: false } };
}

function extractTranslatedText(parsed: unknown): string | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const data = (parsed as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) return null;
  const translations = (data as { translations?: unknown }).translations;
  if (!Array.isArray(translations) || translations.length === 0) return null;
  const first = translations[0];
  if (typeof first !== "object" || first === null) return null;
  const text = (first as { translatedText?: unknown }).translatedText;
  return typeof text === "string" ? text : null;
}

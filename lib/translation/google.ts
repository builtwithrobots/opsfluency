import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type { GlossaryRow } from "@/lib/types/glossary";

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
  error: {
    code: TranslationErrorCode;
    retry_allowed: boolean;
    message?: string;
    /** Wall time of the call, including retries. */
    duration_ms?: number;
    /** 1-based attempt count when the failure surfaced. */
    attempt?: number;
    /** HTTP status code Google returned, when applicable. */
    http_status?: number;
    /** First 2KB of the response body, for debugging non-2xx returns. */
    raw?: string;
  };
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
  /**
   * Cost-tracking attribution. Both flow into a single `ai_call_log`
   * row written best-effort after a successful call. Optional only
   * because the typed shape lets a future caller (e.g. an admin tool
   * translating something that isn't an SOP) skip them — every
   * production caller today passes both.
   */
  sopId?: string | null;
  companyId?: string | null;
}

/**
 * Identifier the platform AI usage tab keys on. Kept as a constant so
 * the writer here and the price table in
 * `app/dashboard/platform/_tabs/ai-usage-tab.tsx` stay in sync.
 */
export const GOOGLE_TRANSLATE_MODEL = "google-translate-v2";

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

interface LogTranslateInput {
  sopId: string | null | undefined;
  companyId: string | null | undefined;
  /** Source character count Google is billed against. */
  inputChars: number;
  /** Translated character count — informational, not billed. */
  outputChars: number;
  durationMs: number;
}

/**
 * Best-effort row into `ai_call_log` after a successful translation.
 * Mirrors the shape and failure handling of `logCall` in
 * `lib/ai/sonnet.ts` — admin client (the table is REVOKE'd from anon
 * + authenticated) and a swallowed catch so a telemetry hiccup never
 * fails an in-flight translation.
 *
 * `unit_kind = 'character'` is what the platform AI usage tab branches
 * on: tokens vs characters use different price-table rows and render
 * different unit labels.
 */
async function logTranslateCall({
  sopId,
  companyId,
  inputChars,
  outputChars,
  durationMs,
}: LogTranslateInput): Promise<void> {
  try {
    const supabase = getAdminClient();
    await supabase.from("ai_call_log").insert({
      model: GOOGLE_TRANSLATE_MODEL,
      input_units: inputChars,
      output_units: outputChars,
      unit_kind: "character",
      sop_id: sopId ?? null,
      company_id: companyId ?? null,
      duration_ms: durationMs,
    });
  } catch {
    // Telemetry must never block the main flow.
  }
}

export async function translateMarkdown(
  input: TranslateMarkdownInput,
): Promise<TranslationResult> {
  const start = Date.now();
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: "TRANSLATION_CONFIG_ERROR",
        retry_allowed: false,
        message: "GOOGLE_CLOUD_TRANSLATION_API_KEY is not set",
        duration_ms: 0,
        attempt: 1,
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
            error: {
              code: "TRANSLATION_INTERNAL",
              retry_allowed: false,
              message: "Invalid JSON from Google Translate",
              duration_ms: Date.now() - start,
              attempt: attempt + 1,
              http_status: res.status,
              raw: res.text.slice(0, 2048),
            },
          };
        }
        const translatedText = extractTranslatedText(parsed);
        if (!translatedText) {
          return {
            ok: false,
            error: {
              code: "TRANSLATION_INTERNAL",
              retry_allowed: false,
              message: "Empty translation response",
              duration_ms: Date.now() - start,
              attempt: attempt + 1,
              http_status: res.status,
              raw: res.text.slice(0, 2048),
            },
          };
        }
        const restored = restorePlaceholders(translatedText, byLower);
        // Source character count is what Google bills against: the
        // markdown the caller actually intends to translate, before
        // placeholder substitution swaps glossary terms with shorter
        // tokens. Counting `substituted` would understate spend.
        await logTranslateCall({
          sopId: input.sopId,
          companyId: input.companyId,
          inputChars: input.markdown.length,
          outputChars: restored.length,
          durationMs: Date.now() - start,
        });
        return { ok: true, translated: restored };
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
            code: "TRANSLATION_RATE_LIMITED",
            retry_allowed: true,
            message: "Google Translate 429",
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
            code: "TRANSLATION_CONFIG_ERROR",
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
          code: "TRANSLATION_INTERNAL",
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
            code: "TRANSLATION_TIMEOUT",
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
          code: "TRANSLATION_INTERNAL",
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

  return {
    ok: false,
    error: {
      code: "TRANSLATION_INTERNAL",
      retry_allowed: false,
      message: "Exhausted retries without a usable response",
      duration_ms: Date.now() - start,
      attempt: MAX_RETRIES + 1,
    },
  };
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

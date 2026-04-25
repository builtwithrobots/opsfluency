import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Single entry point for every Claude Sonnet call in OpsFluency.
 *
 * Per `CLAUDE.md` → "AI call conventions":
 * - 60s hard timeout via `AbortController`
 * - 1 retry on 429 / 5xx with jittered backoff (500–1500ms)
 * - Every call writes one `ai_call_log` row (model, tokens, duration, ids)
 * - Never log the full prompt or response at INFO level
 * - Callers never import `@anthropic-ai/sdk` directly
 *
 * Concrete prompt pipelines (`convertSop`, `flagTerms`, etc.) wrap `callSonnet`
 * and live alongside the SOP import feature when it lands.
 */

export const SONNET_MODEL = "claude-sonnet-4-6";
const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_RETRIES = 1;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export type SonnetErrorCode =
  | "AI_TIMEOUT"
  | "AI_RATE_LIMITED"
  | "AI_PARSE_FAILURE"
  | "AI_TRUNCATED"
  | "AI_INTERNAL";

export interface SonnetSuccess<T> {
  ok: true;
  data: T;
  usage: { input_tokens: number; output_tokens: number };
}

export interface SonnetFailure {
  ok: false;
  error: {
    code: SonnetErrorCode;
    retry_allowed: boolean;
    message?: string;
    /** Up to 2KB of the raw response on parse failures, for debugging. */
    raw?: string;
    /** Wall time of the call, including retries. Useful for "is it slow or stuck?" */
    duration_ms?: number;
    /** 1-based attempt count when the failure surfaced. */
    attempt?: number;
    /** Sonnet model id (kept here so the error payload is fully self-describing). */
    model?: string;
  };
}

export type SonnetResult<T> = SonnetSuccess<T> | SonnetFailure;

export interface SonnetCallContext {
  /** The SOP being worked on, for cost attribution. Use `null` for non-SOP calls. */
  sopId: string | null;
  /** Always required — every AI call belongs to a tenant. */
  companyId: string;
}

/**
 * User message content. Accepts a plain string for text-only prompts or an
 * array of content blocks for vision (image) and document (PDF) prompts.
 * The Anthropic SDK accepts all three shapes in `messages[0].content`.
 */
export type SonnetUserContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | {
          type: "image";
          source:
            | { type: "base64"; media_type: string; data: string }
            | { type: "url"; url: string };
        }
      | {
          type: "document";
          source: { type: "base64"; media_type: "application/pdf"; data: string };
        }
    >;

export interface SonnetCallInput<T> {
  systemPrompt: string;
  userMessage: SonnetUserContent;
  maxTokens: number;
  /** Extract structured output from the raw response text. Must throw on malformed input. */
  parse: (rawText: string) => T;
  /** Optional external signal; the timeout is applied in addition. */
  signal?: AbortSignal;
}

/**
 * Runs a single Sonnet call with timeout, one retry on transient errors,
 * a parsing step, and a cost-log write. Never throws for recognized failure
 * modes — returns `{ ok: false, error }` so callers can discriminate.
 */
export async function callSonnet<T>(
  input: SonnetCallInput<T>,
  ctx: SonnetCallContext,
): Promise<SonnetResult<T>> {
  const start = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const signal = input.signal
      ? anySignal([input.signal, controller.signal])
      : controller.signal;

    try {
      const response = await getClient().messages.create(
        {
          model: SONNET_MODEL,
          max_tokens: input.maxTokens,
          system: input.systemPrompt,
          // The Anthropic SDK narrows image media_type to a specific union;
          // SOP_UPLOAD_MIME_TYPES enforces the same set on input. Cast at the
          // SDK boundary so the call site stays clean.
          messages: [
            {
              role: "user",
              content: input.userMessage as Parameters<
                Anthropic["messages"]["create"]
              >[0]["messages"][number]["content"],
            },
          ],
        },
        { signal },
      );

      const rawText = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as { text: string }).text)
        .join("");

      // `max_tokens` truncation: Anthropic stopped mid-stream, so the JSON
      // is guaranteed broken. Surface this as its own code rather than
      // confusing the manager with a parse failure on a perfectly valid
      // partial response.
      if (response.stop_reason === "max_tokens") {
        await logCall({
          ctx,
          model: SONNET_MODEL,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          durationMs: Date.now() - start,
        });
        return {
          ok: false,
          error: {
            code: "AI_TRUNCATED",
            retry_allowed: false,
            message: `Sonnet hit the ${input.maxTokens}-token output cap. Document is unusually long — split it or raise maxTokens.`,
            raw: rawText.slice(0, 2048),
            duration_ms: Date.now() - start,
            attempt: attempt + 1,
            model: SONNET_MODEL,
          },
        };
      }

      let parsed: T;
      try {
        parsed = input.parse(rawText);
      } catch {
        await logCall({
          ctx,
          model: SONNET_MODEL,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          durationMs: Date.now() - start,
        });
        return {
          ok: false,
          error: {
            code: "AI_PARSE_FAILURE",
            retry_allowed: true,
            raw: rawText.slice(0, 2048),
            duration_ms: Date.now() - start,
            attempt: attempt + 1,
            model: SONNET_MODEL,
          },
        };
      }

      await logCall({
        ctx,
        model: SONNET_MODEL,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        durationMs: Date.now() - start,
      });

      return {
        ok: true,
        data: parsed,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      };
    } catch (err) {
      lastError = err;

      if (controller.signal.aborted && !input.signal?.aborted) {
        return {
          ok: false,
          error: {
            code: "AI_TIMEOUT",
            retry_allowed: true,
            message: `Sonnet did not respond within ${DEFAULT_TIMEOUT_MS / 1000}s`,
            duration_ms: Date.now() - start,
            attempt: attempt + 1,
            model: SONNET_MODEL,
          },
        };
      }

      if (shouldRetry(err) && attempt < MAX_RETRIES) {
        await sleep(500 + Math.floor(Math.random() * 1000));
        continue;
      }

      if (isRateLimited(err)) {
        return {
          ok: false,
          error: {
            code: "AI_RATE_LIMITED",
            retry_allowed: true,
            message: err instanceof Error ? err.message : "429 from Anthropic",
            duration_ms: Date.now() - start,
            attempt: attempt + 1,
            model: SONNET_MODEL,
          },
        };
      }

      return {
        ok: false,
        error: {
          code: "AI_INTERNAL",
          retry_allowed: false,
          message: err instanceof Error ? err.message : String(err),
          duration_ms: Date.now() - start,
          attempt: attempt + 1,
          model: SONNET_MODEL,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    ok: false,
    error: {
      code: "AI_INTERNAL",
      retry_allowed: false,
      message: lastError instanceof Error ? lastError.message : String(lastError),
      duration_ms: Date.now() - start,
      attempt: MAX_RETRIES + 1,
      model: SONNET_MODEL,
    },
  };
}

function shouldRetry(err: unknown): boolean {
  if (err instanceof Anthropic.APIError) {
    return err.status === 429 || (err.status !== undefined && err.status >= 500);
  }
  return false;
}

function isRateLimited(err: unknown): boolean {
  return err instanceof Anthropic.APIError && err.status === 429;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cross-compatibility helper for Node versions without `AbortSignal.any`.
 * Combines multiple signals so aborting any of them aborts the returned one.
 */
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

interface LogCallInput {
  ctx: SonnetCallContext;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

/**
 * Writes an `ai_call_log` row. Uses the admin client because this runs
 * outside any user-facing transaction and must not be gated by RLS — we
 * always want to capture cost data even when a call ultimately fails for
 * an authorization reason.
 */
async function logCall({
  ctx,
  model,
  inputTokens,
  outputTokens,
  durationMs,
}: LogCallInput): Promise<void> {
  try {
    const supabase = getAdminClient();
    await supabase.from("ai_call_log").insert({
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      sop_id: ctx.sopId,
      company_id: ctx.companyId,
      duration_ms: durationMs,
    });
  } catch {
    // Log table may not exist yet (pre-Phase-5) — never fail the main call
    // over a missed telemetry row.
  }
}

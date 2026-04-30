'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface ProgressStage {
  /** Show this label once `elapsed_ms` reaches `at_ms`. */
  at_ms: number;
  label: string;
}

interface JobProgressProps {
  /** Total expected duration in ms. The bar smoothly approaches 92% by this point. */
  expectedMs: number;
  /** Header headline shown above the bar. */
  headline: string;
  /** Stages, ordered by `at_ms` ascending. The latest stage whose `at_ms` ≤ elapsed wins. */
  stages: ProgressStage[];
}

/**
 * Animated progress UI for a long-running server action.
 *
 * The bar fills toward `expectedMs` using an `1 - exp(-elapsed/k)` curve so it
 * never sits perfectly still and never reaches 100% until the parent un-mounts
 * this (i.e. the call returned). Stage labels rotate through what the call is
 * actually doing — "Reading the document", "Sending to Sonnet", etc.
 *
 * Honest design notes:
 *   - We never claim a percentage we don't know — the bar caps at 92% while
 *     the call is in flight; only success/failure can move it past that.
 *   - Elapsed time is shown in mm:ss so a stuck call is visually obvious.
 */
export function JobProgress({ expectedMs, headline, stages }: JobProgressProps) {
  const [elapsed, setElapsed] = useState(0);
  // Initialised inside useEffect — calling Date.now() during render trips the
  // React 19 "impure function during render" lint rule.
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const start = startRef.current ?? Date.now();
      setElapsed(Date.now() - start);
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  // Asymptotic curve toward 92% — the easiest "honest" feel.
  const k = expectedMs / 2.5; // tune-knob: lower = fills faster early
  const raw = 1 - Math.exp(-elapsed / k);
  const pct = Math.min(0.92, raw) * 100;

  // Pick latest stage whose at_ms ≤ elapsed.
  const stage = stages.reduce<ProgressStage | null>((acc, s) => (s.at_ms <= elapsed ? s : acc), null);

  const seconds = Math.floor(elapsed / 1000);
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  const timeText = `${mm}:${ss.toString().padStart(2, '0')}`;

  return (
    <div className="rounded-xl border border-(--color-brand) bg-(--color-brand)/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-dc-text">{headline}</p>
        <span className="font-mono text-xs text-dc-text-3" aria-label="Elapsed time">{timeText}</span>
      </div>

      <p className="mt-1 text-xs text-dc-text-2" aria-live="polite">
        {stage?.label ?? stages[0]?.label ?? 'Working…'}
      </p>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-dc-raised"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div
          className="h-full rounded-full bg-(--color-brand) transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface JobErrorProps {
  /** Short error code like `AI_TIMEOUT`. */
  code: string;
  /** Human-readable message; may be undefined. */
  message?: string;
  /** Full debug payload — duration_ms, attempt, raw, model, etc. */
  details?: unknown;
  /** Called when the manager clicks Retry. Omit to hide the button. */
  onRetry?: () => void;
  /** Adds an extra labelled context block below the error code (e.g. SOP id). */
  context?: Record<string, string | number | undefined>;
}

const FRIENDLY_HINTS: Record<string, string> = {
  AI_TIMEOUT:
    'Sonnet did not respond in time. This is usually transient — retry once. If it keeps timing out, the document may be unusually large or the API is under load.',
  AI_RATE_LIMITED:
    'Anthropic returned 429. Wait 30 seconds and retry; if it persists, your account may be in a rate-limit window.',
  AI_PARSE_FAILURE:
    'Sonnet returned text that did not match the expected JSON shape. The raw response is captured below — share it with engineering.',
  AI_TRUNCATED:
    'This document is too large to convert in one pass. Upload each procedure as a separate SOP — one procedure per file works best.',
  AI_INTERNAL: 'Anthropic returned an unexpected error. Retry first; if it persists, capture the details below.',
  TRANSLATION_TIMEOUT: 'Google Translate did not respond in time. Retry once.',
  TRANSLATION_RATE_LIMITED:
    'Google returned 429. Translation calls are billed by character; very large SOPs can hit per-minute limits. Retry shortly.',
  TRANSLATION_CONFIG_ERROR:
    'Google rejected the request. Most often: the API key is missing, restricted to a different API, or the project has billing disabled.',
  TRANSLATION_INTERNAL: 'Google returned an unexpected error. Retry first; if it persists, capture the details below.',
  INVALID_TRANSITION: 'The SOP changed status in another tab — refresh the page to see the current state.',
  STATUS_CHANGED: 'Another action moved this SOP forward already — refresh the page.',
  NOT_FOUND: 'Could not find the underlying record. Refresh the page.',
};

export function JobError({ code, message, details, onRetry, context }: JobErrorProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const debugBlob = JSON.stringify(
    {
      code,
      message,
      ...(context ?? {}),
      details,
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  );

  async function copyDebug() {
    try {
      await navigator.clipboard.writeText(debugBlob);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — falls back to user select-all in the textarea
    }
  }

  const hint = FRIENDLY_HINTS[code];

  return (
    <div className="rounded-xl border border-(--color-signal-urgent) bg-(--color-signal-urgent)/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-(--color-signal-urgent)" strokeWidth={2} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-(--color-signal-urgent)">{code}</p>
          {message && <p className="mt-1 text-sm text-dc-text">{message}</p>}
          {hint && <p className="mt-2 text-xs text-dc-text-2">{hint}</p>}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 inline-flex min-h-[36px] items-center gap-1 rounded-md text-xs font-medium text-dc-text-2 hover:text-dc-text"
          >
            {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            Technical details
          </button>

          {open && (
            <div className="mt-2">
              <pre className="max-h-64 overflow-auto rounded-md border border-[color:var(--dc-edge)] bg-dc-surface p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-dc-text-2">
                {debugBlob}
              </pre>
              <button
                type="button"
                onClick={copyDebug}
                className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-surface px-2.5 py-1 text-xs text-dc-text-2 hover:bg-dc-raised hover:text-dc-text"
              >
                {copied ? <Check className="size-3.5 text-(--color-signal-ok)" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied' : 'Copy debug info'}
              </button>
            </div>
          )}

          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-1.5 text-sm font-medium text-dc-text hover:bg-dc-raised"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

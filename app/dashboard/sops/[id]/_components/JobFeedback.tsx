'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Copy, Check, CheckCircle2 } from 'lucide-react';
import type { ConversionProgressState } from './RunConversionButton';

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
 * Animated progress UI for long-running server actions without real backend
 * progress signals (e.g. translation). Uses a fake asymptotic curve so the
 * bar never sits perfectly still and never reaches 100% until un-mounted.
 * Kept for translation — conversion uses ConversionProgress instead.
 */
export function JobProgress({ expectedMs, headline, stages }: JobProgressProps) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const start = startRef.current ?? Date.now();
      setElapsed(Date.now() - start);
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const k = expectedMs / 2.5;
  const raw = 1 - Math.exp(-elapsed / k);
  const pct = Math.min(0.92, raw) * 100;

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

// ---------------------------------------------------------------------------
// ConversionProgress — real chunk-aware progress for the SSE conversion path
// ---------------------------------------------------------------------------

interface ConversionProgressProps {
  progress: ConversionProgressState;
}

function formatEta(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `~${s}s remaining`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `~${m}m ${rem}s remaining`;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

/**
 * Chunk-aware progress indicator for the SSE-powered SOP conversion pipeline.
 *
 * Layout:
 *   headline + elapsed timer
 *   animated label (fades between chunk labels)
 *   section pill row (one pill per chunk, fills green as each completes)
 *   progress bar (accurate: chunk progress → 80%, flagging → 95%)
 *   ETA chip (shown once at least one chunk is done)
 */
export function ConversionProgress({ progress }: ConversionProgressProps) {
  const { phase, chunksDone, chunksTotal, currentLabel, elapsedMs } = progress;

  // Progress percentage:
  //   Converting — each chunk contributes (80% / chunksTotal)
  //   Flagging   — jumps to 88% and slowly approaches 95% while waiting
  //   Done       — 100% (component unmounted by parent)
  let pct: number;
  if (phase === 'flagging') {
    // Asymptotic from 80% toward 95% during flagging (typically fast)
    const flagElapsedMs = elapsedMs - (chunksTotal > 0 ? (elapsedMs * 0.8) : 0);
    const k = 20_000 / 2.5;
    pct = 80 + Math.min(15, (1 - Math.exp(-Math.max(0, flagElapsedMs) / k)) * 15);
  } else {
    const conversionPct = chunksTotal > 0 ? (chunksDone / chunksTotal) * 80 : 0;
    pct = conversionPct;
  }

  // ETA — only show once we have real data (at least one chunk done).
  let etaText: string | null = null;
  if (phase === 'converting' && chunksDone > 0 && chunksDone < chunksTotal) {
    const avgMsPerChunk = elapsedMs / chunksDone;
    const remaining = (chunksTotal - chunksDone) * avgMsPerChunk;
    etaText = formatEta(remaining);
  }

  const showPills = chunksTotal > 1;

  return (
    <div className="rounded-xl border border-(--color-brand) bg-(--color-brand)/5 p-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-dc-text">Claude is converting your document</p>
        <span className="font-mono text-xs text-dc-text-3" aria-label="Elapsed time">
          {formatElapsed(elapsedMs)}
        </span>
      </div>

      {/* Animated label */}
      <p
        className="mt-1 text-xs text-dc-text-2 transition-opacity duration-300"
        aria-live="polite"
        aria-atomic="true"
      >
        {phase === 'converting' && chunksTotal > 1
          ? `Converting section ${chunksDone + 1} of ${chunksTotal}${currentLabel ? ` — ${currentLabel}` : ''}`
          : currentLabel}
      </p>

      {/* Section pills — only when multiple chunks */}
      {showPills && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Section progress">
          {Array.from({ length: chunksTotal }, (_, i) => {
            const isDone = i < chunksDone;
            const isActive = phase === 'converting' && i === chunksDone;
            return (
              <span
                key={i}
                className={[
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-300',
                  isDone
                    ? 'bg-(--color-signal-ok)/15 text-(--color-signal-ok)'
                    : isActive
                      ? 'bg-(--color-brand)/20 text-(--color-brand)'
                      : 'bg-dc-raised text-dc-text-3',
                ].join(' ')}
                aria-label={`Section ${i + 1} ${isDone ? 'complete' : isActive ? 'in progress' : 'pending'}`}
              >
                {isDone && (
                  <CheckCircle2 className="size-2.5 shrink-0" aria-hidden />
                )}
                {i + 1}
              </span>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-dc-raised"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Conversion progress"
      >
        <div
          className="h-full rounded-full bg-(--color-brand) transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* ETA chip */}
      {etaText && (
        <p className="mt-2 text-[11px] text-dc-text-3" aria-live="polite">
          {etaText}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JobError — unchanged
// ---------------------------------------------------------------------------

interface JobErrorProps {
  code: string;
  message?: string;
  details?: unknown;
  onRetry?: () => void;
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

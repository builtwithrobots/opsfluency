'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  BatteryFull,
  ExternalLink,
  Signal,
  Smartphone,
  Wifi,
} from 'lucide-react';
import { AccessDeniedView } from './AccessDeniedView';

type PreviewMode = 'allowed' | 'denied';

interface Props {
  /** Label set on the QR — empty string falls back to a placeholder. */
  label: string;
  /** Destination URL preview (custom URL flow only). */
  url: string;
  /** Human summary of the audience scope, used in the denied preview. */
  audience_summary?: string;
}

/**
 * Side-by-side preview of what an end user sees after a successful or denied
 * scan. Visually mirrors the worker-app emulator (`app/dashboard/emulator`)
 * so the creator sees the same iOS-style chrome they'd see in production.
 *
 * The destination URL inside the "In audience" view is a real anchor — the
 * creator can click it to open the link in a new tab and verify it loads.
 */
export function DevicePreview({ label, url, audience_summary }: Props) {
  const [mode, setMode] = useState<PreviewMode>('allowed');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.15em] text-dc-text-3 uppercase">
          Device preview
        </p>
        <div
          role="tablist"
          aria-label="Preview mode"
          className="inline-flex rounded-md border border-[color:var(--dc-edge)] bg-dc-raised p-0.5 text-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'allowed'}
            onClick={() => setMode('allowed')}
            className={
              mode === 'allowed'
                ? 'rounded-sm bg-(--color-brand) px-3 py-1 font-medium text-white'
                : 'rounded-sm px-3 py-1 text-dc-text-2 hover:text-dc-text'
            }
          >
            In audience
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'denied'}
            onClick={() => setMode('denied')}
            className={
              mode === 'denied'
                ? 'rounded-sm bg-(--color-brand) px-3 py-1 font-medium text-white'
                : 'rounded-sm px-3 py-1 text-dc-text-2 hover:text-dc-text'
            }
          >
            Not in audience
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <DeviceFrame>
          {mode === 'allowed' ? (
            <AllowedScanScreen label={label} url={url} />
          ) : (
            <ScanShell>
              <AccessDeniedView
                qr_code_id=""
                label={label || undefined}
                interactive={false}
                audience_summary={audience_summary}
              />
            </ScanShell>
          )}
        </DeviceFrame>
      </div>

      <p className="text-xs text-dc-text-3">
        This is what a worker sees on their phone after scanning. The URL in
        the &ldquo;In audience&rdquo; view is live — click it to open the
        destination in a new tab.
      </p>
    </div>
  );
}

// ── Device frame ─────────────────────────────────────────────────────────────
//
// Mirrors `app/dashboard/emulator/_components/EmulatorClient.tsx` — same
// rounded bezel, dynamic island, status bar height, and font styling. Sized
// down from the emulator's 390×844 to fit alongside a configuration form.
// Proportions stay iPhone-accurate (~9/19).

const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 680;
const STATUS_BAR_HEIGHT = 40;

function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
      className="relative shrink-0 overflow-hidden rounded-[44px] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl dark:border-zinc-700"
    >
      <div className="flex size-full flex-col overflow-hidden rounded-[34px] bg-white">
        <StatusBar />
        <div className="min-h-0 flex-1 overflow-auto bg-dc-base">{children}</div>
      </div>
      {/* Dynamic-island-style notch sits on top of the status bar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1.5 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-zinc-900"
      />
    </div>
  );
}

function StatusBar() {
  return (
    <div
      style={{ height: STATUS_BAR_HEIGHT }}
      className="flex shrink-0 items-end justify-between bg-white px-6 pb-1.5 text-[12px] font-semibold text-zinc-900 select-none"
      aria-hidden
    >
      <span className="tabular-nums">9:41</span>
      <span className="flex items-center gap-1.5">
        <Signal className="size-3" strokeWidth={2.5} />
        <Wifi className="size-3" strokeWidth={2.5} />
        <BatteryFull className="size-3.5" strokeWidth={2.5} />
      </span>
    </div>
  );
}

// ── Inner screens ────────────────────────────────────────────────────────────

/**
 * Wraps content in the same shell that `/s/[qr_code_id]` uses for its denied
 * state — a bg-dc-base body with a centred bg-dc-surface card. Re-used for
 * the in-audience screen so the visual feel matches across both states.
 */
function ScanShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-6">
      <div className="w-full rounded-2xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-sm">
        {children}
      </div>
    </div>
  );
}

function AllowedScanScreen({ label, url }: { label: string; url: string }) {
  const trimmed = url.trim();
  let host = '';
  let valid = false;
  try {
    if (trimmed) {
      host = new URL(trimmed).host;
      valid = true;
    }
  } catch {
    valid = false;
  }
  const display = trimmed || 'https://example.com';

  return (
    <ScanShell>
      <div className="flex flex-col items-center gap-5 px-6 py-8 text-center">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-2xl bg-(--color-brand)/10 text-(--color-brand)"
        >
          <Smartphone className="size-6" strokeWidth={1.75} />
        </span>

        <div className="flex flex-col gap-1">
          <p className="font-display text-base font-semibold text-dc-text">
            {label ? `Opening ${label}` : 'Opening your link'}
          </p>
          <p className="text-xs text-dc-text-2">
            You&apos;ll be redirected to{' '}
            <span className="font-medium text-dc-text">{host || 'the destination'}</span>.
          </p>
        </div>

        {/* Working anchor — opens the destination in a new tab so the creator
            can verify it loads correctly without leaving the builder. */}
        {valid ? (
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-full items-center gap-2 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-left text-xs text-dc-text-2 transition-colors hover:border-(--color-brand) hover:text-dc-text"
            title={`Open ${display} in a new tab`}
          >
            <ExternalLink aria-hidden className="size-3.5 shrink-0 text-dc-text-3 group-hover:text-(--color-brand)" />
            <span className="truncate">{display}</span>
          </a>
        ) : (
          <div
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-left text-xs text-dc-text-3"
            aria-live="polite"
          >
            <ExternalLink aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">Enter a URL above to enable this link</span>
          </div>
        )}

        {valid && (
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <ArrowUpRight className="size-4" strokeWidth={2.5} />
            Open link
          </a>
        )}

        <span
          aria-hidden
          className="inline-flex items-center gap-1 rounded-full bg-(--color-signal-ok)/10 px-3 py-1 text-[10px] font-medium tracking-wide text-(--color-signal-ok) uppercase"
        >
          Access granted
        </span>
      </div>
    </ScanShell>
  );
}

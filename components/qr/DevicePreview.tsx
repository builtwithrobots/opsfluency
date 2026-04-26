'use client';

import { useState } from 'react';
import { BatteryFull, Signal, Wifi } from 'lucide-react';

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
 * scan. The "In audience" view iframes `/app/external?preview=1&url=…` so
 * the creator sees the *real* worker-app chrome — real back arrow, real
 * BottomNav from /app/layout, real iframe of the destination URL — and
 * every link inside the frame actually works (within the iframe). Same
 * approach as `/dashboard/emulator`.
 *
 * The "Not in audience" view renders `AccessDeniedView` directly because
 * the live deny experience lives at `/s/[qr_code_id]`, outside the /app/*
 * layout, and therefore has no BottomNav. That parity matters.
 */
export function DevicePreview({ label, url, audience_summary }: Props) {
  const [mode, setMode] = useState<PreviewMode>('allowed');

  const trimmed = url.trim();
  const validUrl = isValidUrl(trimmed) ? trimmed : null;

  const previewSrc = validUrl
    ? `/app/external?preview=1&url=${encodeURIComponent(validUrl)}${
        label ? `&label=${encodeURIComponent(label)}` : ''
      }`
    : null;

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
            <AllowedScreen previewSrc={previewSrc} />
          ) : (
            <DeniedScreen label={label} audience_summary={audience_summary} />
          )}
        </DeviceFrame>
      </div>

      <p className="text-xs text-dc-text-3">
        The phone is running the live <code>/app/external</code> chrome in
        an iframe — back arrow and bottom-nav links navigate inside the
        frame, exactly as a worker would experience them.
      </p>
    </div>
  );
}

function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
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
        <div className="min-h-0 flex-1 bg-dc-base">{children}</div>
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

function AllowedScreen({ previewSrc }: { previewSrc: string | null }) {
  if (!previewSrc) {
    return (
      <div className="flex h-full items-center justify-center bg-dc-base px-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-dc-text-2">
            Enter a destination URL
          </p>
          <p className="text-xs text-dc-text-3">
            The live preview will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={previewSrc}
      title="Live worker app preview"
      // No sandbox: the iframe is same-origin and needs the full Clerk
      // session + Server Action support to render. The /app/layout
      // suppresses the PreviewBanner inside iframes via Sec-Fetch-Dest.
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="size-full border-0 bg-white"
    />
  );
}

function DeniedScreen({
  label,
  audience_summary,
}: {
  label: string;
  audience_summary?: string;
}) {
  // The live deny experience renders on `/s/[qr_code_id]` — outside the
  // /app/* layout, so no BottomNav appears there. Mirror that here.
  return (
    <div className="flex min-h-full items-center justify-center overflow-auto px-4 py-6">
      <div className="w-full rounded-2xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-sm">
        <AccessDeniedView
          qr_code_id=""
          label={label || undefined}
          interactive={false}
          audience_summary={audience_summary}
        />
      </div>
    </div>
  );
}

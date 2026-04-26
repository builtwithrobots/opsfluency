'use client';

import { useMemo, useState } from 'react';
import { BatteryFull, Signal, Wifi } from 'lucide-react';

import { detectEmbed } from '@/lib/qr/embed';
import { ExternalLinkView } from '@/components/app/ExternalLinkView';
import { AccessDeniedView } from './AccessDeniedView';
import { PreviewBottomNav } from './PreviewBottomNav';

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
 * and renders the *actual* `/app/external` chrome — same `ExternalLinkView`
 * the live app uses, plus a presentational `PreviewBottomNav` to mimic the
 * BottomNav that lives one level up in `/app/layout.tsx`. The iframe inside
 * the frame loads the destination URL live, so YouTube and Loom links play
 * here exactly as they will in production.
 */
export function DevicePreview({ label, url, audience_summary }: Props) {
  const [mode, setMode] = useState<PreviewMode>('allowed');

  const trimmed = url.trim();
  const embed = useMemo(() => (trimmed ? detectEmbed(trimmed) : null), [trimmed]);

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
            <AllowedScreen label={label} embed={embed} />
          ) : (
            <DeniedScreen label={label} audience_summary={audience_summary} />
          )}
        </DeviceFrame>
      </div>

      <p className="text-xs text-dc-text-3">
        This is the live `/app/external` chrome. The iframe loads the
        destination URL — YouTube and Loom play in place; other sites may
        render blank if they refuse to be iframed (the &ldquo;Open&rdquo;
        button always works).
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

function AllowedScreen({
  label,
  embed,
}: {
  label: string;
  embed: ReturnType<typeof detectEmbed> | null;
}) {
  // No URL yet → render an empty placeholder shell that matches the live
  // chrome, so the creator sees the same frame the moment they start.
  if (!embed) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center bg-dc-base px-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-dc-text-2">
              Enter a destination URL
            </p>
            <p className="text-xs text-dc-text-3">
              The link preview will appear here.
            </p>
          </div>
        </div>
        <PreviewBottomNav />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ExternalLinkView label={label} embed={embed} />
      </div>
      <PreviewBottomNav />
    </div>
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
    <div className="flex min-h-full items-center justify-center px-4 py-6">
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

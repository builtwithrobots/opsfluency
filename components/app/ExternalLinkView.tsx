'use client';

import { ArrowLeft, ExternalLink as ExternalIcon, Info } from 'lucide-react';
import Link from 'next/link';

import type { EmbedInfo } from '@/lib/qr/embed';

interface Props {
  label: string;
  embed: EmbedInfo;
}

/**
 * In-app wrapper for QR codes that target an external URL. Renders the
 * destination inside an iframe and frames it with worker-app chrome so
 * the user always has a one-tap path back to /app/home via either the
 * top-left back button or the BottomNav.
 *
 * Many websites refuse to be iframed (X-Frame-Options: DENY or CSP
 * frame-ancestors). YouTube and Loom resolve to their /embed forms
 * which are designed to be framed; for any other URL the iframe may
 * render blank, so we always surface an "Open in browser" anchor as
 * the escape hatch.
 */
export function ExternalLinkView({ label, embed }: Props) {
  const showFallbackHint = embed.provider === 'generic';

  return (
    // The component fills whatever height its parent gives it. The
    // production page (/app/external) wraps this in a viewport-tall
    // container; the QR builder's device preview wraps it in the inner
    // 320×680 phone frame. Either way the iframe absolutely fills the
    // remaining space below the sticky header.
    <div className="flex h-full min-h-0 flex-col bg-dc-base">
      <header className="flex shrink-0 items-center gap-3 border-b border-dc-edge bg-dc-surface/95 px-3 py-2 backdrop-blur">
        <Link
          href="/app/home"
          aria-label="Back to home"
          className="-ml-1 inline-flex size-9 items-center justify-center rounded-md text-dc-text-2 hover:bg-dc-raised hover:text-dc-text"
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-dc-text">
            {label || 'External link'}
          </p>
          {embed.host && (
            <p className="truncate text-[11px] text-dc-text-3">{embed.host}</p>
          )}
        </div>

        <a
          href={embed.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-dc-edge bg-dc-raised px-3 py-1.5 text-xs font-semibold text-dc-text-2 hover:text-dc-text"
        >
          <ExternalIcon className="size-3.5" strokeWidth={2} aria-hidden />
          Open
        </a>
      </header>

      {showFallbackHint && (
        <div className="flex shrink-0 items-start gap-2 border-b border-dc-edge bg-(--color-brand)/5 px-4 py-2 text-xs text-dc-text-2">
          <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-brand)" strokeWidth={2} />
          <p>
            Some sites can&apos;t be displayed inside the app. If this page
            stays blank, tap <strong className="text-dc-text">Open</strong> to
            view it in your browser.
          </p>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <iframe
          src={embed.embed_url}
          title={label || embed.host || 'External content'}
          // Allow common video features so YouTube / Loom playback works.
          // Sandbox is intentionally omitted — third-party players need
          // scripts, same-origin auth, and gesture handlers to function.
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full border-0 bg-white"
        />
      </div>
    </div>
  );
}

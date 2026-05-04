"use client";

import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Reusable phone-frame around an iframe of `/app/sop/[id]?preview=1`.
 *
 * Styled to match the worker app mockup: light silver chassis, black dynamic
 * island, and a fake iOS status bar so the manager sees exactly the chrome an
 * employee would see on a real device.
 *
 * Fixed 390×800 iframe viewport (390×844 total with 44px status bar) matches
 * iPhone 12+ logical pixels.
 */

interface PhoneFrameProps {
  src: string;
  title: string;
  caption?: string;
}

export function PhoneFrame({ src, title, caption }: PhoneFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  function postScrollTop(enabled: boolean) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "OPSF_SCROLL_TOP", enabled },
      window.location.origin,
    );
  }

  function handleIframeLoad() {
    // Re-send after every navigation so the new page's listener gets the state.
    if (showScrollTop) postScrollTop(true);
  }

  function toggleScrollTop() {
    const next = !showScrollTop;
    setShowScrollTop(next);
    postScrollTop(next);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Chassis — light silver, matching the worker app mockup */}
      <div
        className="relative shrink-0 rounded-[2.75rem] p-3 shadow-2xl ring-1 ring-black/10"
        style={{
          width: 414,
          background: "linear-gradient(160deg, #f0f0f5 0%, #dcdce4 100%)",
        }}
      >
        {/* Dynamic island — black pill, always */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-5 left-1/2 z-10 h-[26px] w-[120px] -translate-x-1/2 rounded-full bg-black"
        />

        {/* Screen */}
        <div className="overflow-hidden rounded-[2.25rem] bg-white">

          {/* Status bar — 44px tall, sits above the iframe */}
          <div
            aria-hidden
            className="flex h-11 items-end justify-between bg-white px-7 pb-1.5"
          >
            {/* Time */}
            <span className="text-[13px] font-semibold leading-none text-zinc-900 tabular-nums">
              9:41
            </span>

            {/* Signal + WiFi + Battery */}
            <div className="flex items-center gap-[5px]">
              {/* Cellular signal — 4 bars */}
              <svg width="17" height="12" viewBox="0 0 17 12" aria-hidden fill="currentColor" className="text-zinc-900">
                <rect x="0"    y="7"  width="3" height="5"  rx="0.75" />
                <rect x="4.5"  y="4"  width="3" height="8"  rx="0.75" />
                <rect x="9"    y="2"  width="3" height="10" rx="0.75" />
                <rect x="13.5" y="0"  width="3" height="12" rx="0.75" />
              </svg>

              {/* WiFi */}
              <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden fill="none" className="text-zinc-900">
                <path d="M8 9.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z" fill="currentColor"/>
                <path d="M4.636 7.136A4.772 4.772 0 0 1 8 5.875c1.295 0 2.47.505 3.364 1.261" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                <path d="M1.757 4.257A8.496 8.496 0 0 1 8 1.625a8.496 8.496 0 0 1 6.243 2.632" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>

              {/* Battery */}
              <div className="flex items-center gap-px">
                <div className="relative h-[12px] w-[23px] rounded-[3px] border border-zinc-900/35 p-px">
                  <div className="h-full w-[75%] rounded-[1.5px] bg-zinc-900" />
                </div>
                {/* Battery tip */}
                <div className="h-[5px] w-[2px] rounded-r-full bg-zinc-900/35" />
              </div>
            </div>
          </div>

          {/* Worker page iframe — 800px keeps total screen height at 844 */}
          <iframe
            ref={iframeRef}
            title={title}
            src={src}
            width={390}
            height={800}
            onLoad={handleIframeLoad}
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="block border-0 bg-white"
            style={{ width: 390, height: 800 }}
          />
        </div>
      </div>

      {/* Scroll-to-top toggle */}
      <button
        type="button"
        onClick={toggleScrollTop}
        aria-pressed={showScrollTop}
        title={showScrollTop ? "Hide scroll-to-top button" : "Show scroll-to-top button"}
        className={[
          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
          showScrollTop
            ? "border-(--color-brand)/30 bg-(--color-brand)/10 text-(--color-brand)"
            : "border-[color:var(--dc-edge)] bg-dc-surface text-dc-text-2 hover:text-dc-text",
        ].join(" ")}
      >
        <ArrowUp className="size-3.5" strokeWidth={2} aria-hidden />
        Scroll-to-top
      </button>

      {caption && (
        <p className="text-xs text-dc-text-3">{caption}</p>
      )}
    </div>
  );
}

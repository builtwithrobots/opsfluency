"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  /** True when rendered inside the emulator iframe. Button stays hidden
   *  until the emulator sends an OPSF_SCROLL_TOP postMessage to enable it. */
  isEmbedded?: boolean;
}

/**
 * Small floating button that appears after the user scrolls 300px down.
 * Positioned above the bottom nav using safe-area-inset so it clears
 * the iOS home indicator on notched devices.
 *
 * When isEmbedded is true (inside the emulator iframe) the button is hidden
 * by default and only activates when the emulator sends:
 *   postMessage({ type: 'OPSF_SCROLL_TOP', enabled: boolean }, origin)
 */
export function ScrollToTopButton({ isEmbedded = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [emulatorEnabled, setEmulatorEnabled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isEmbedded) return;
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "OPSF_SCROLL_TOP") {
        setEmulatorEnabled(!!e.data.enabled);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isEmbedded]);

  const visible = isEmbedded ? (emulatorEnabled && scrolled) : scrolled;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={[
        "fixed right-4 z-40 flex size-10 items-center justify-center rounded-full",
        "border border-[color:var(--dc-edge)] bg-dc-surface/90 text-dc-text-2 shadow-md backdrop-blur",
        "transition-all duration-200",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none",
      ].join(" ")}
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden />
    </button>
  );
}

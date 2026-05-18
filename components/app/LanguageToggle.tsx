"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useTransition } from "react";
import { LayoutGroup, motion } from "framer-motion";

import { hapticTap } from "@/lib/haptics";
import type { WorkerLanguage } from "@/lib/types/sop";
import { setLanguagePreference } from "@/app/dashboard/sops/_actions";

interface Props {
  current: WorkerLanguage;
}

/**
 * Bilingual EN/ES pill toggle used everywhere in the worker PWA.
 *
 * Visual: a brand-tinted pill slides between EN and ES via framer-motion
 * `layoutId`. The `LayoutGroup` is scoped per-instance with `useId` so
 * two toggles on the same page (e.g. header + footer) don't fight over
 * the indicator.
 *
 * Navigation:
 *   - Standalone worker PWA → `router.replace` + `router.refresh()`.
 *     Keeps scroll position, avoids the white flash of a hard reload,
 *     and lets the next render fade in via `animate-fade-in` on the
 *     page surface.
 *   - Inside the manager dashboard's `/app/sop/[id]` iframe preview →
 *     hard `window.location.replace`. The embedded router doesn't
 *     reliably re-fetch the RSC payload, so `router.refresh()` would
 *     leave the URL updated but the content stale.
 *
 * Hit area: the visible pill is 32×36; the `before` pseudo expands the
 * touch target to ≥44×44 so glove taps work. Don't drop the pseudo.
 */
export function LanguageToggle({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/app/home";
  const searchParams = useSearchParams();
  const groupId = useId();
  const [isPending, startTransition] = useTransition();

  function pick(lang: WorkerLanguage) {
    if (lang === current || isPending) return;
    hapticTap();
    startTransition(async () => {
      await setLanguagePreference({ language: lang });

      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("lang", lang);
      const next = `${pathname}?${params.toString()}`;

      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      if (inIframe) {
        window.location.replace(next);
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex shrink-0 rounded-full border border-[color:var(--dc-edge)] bg-dc-raised p-0.5"
    >
      <LayoutGroup id={groupId}>
        {(["en", "es"] as const).map((l) => {
          const active = current === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => pick(l)}
              aria-pressed={active}
              className={[
                "relative flex h-8 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors",
                "before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']",
                active ? "text-white" : "text-dc-text-2 hover:text-dc-text",
              ].join(" ")}
            >
              {active && (
                <motion.span
                  layoutId="lang-active-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-(--color-brand)"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{l.toUpperCase()}</span>
            </button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}

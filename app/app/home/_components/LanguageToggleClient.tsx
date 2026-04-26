"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { setLanguagePreference } from "@/app/dashboard/sops/_actions";
import type { WorkerLanguage } from "@/lib/types/sop";

interface Props {
  current: WorkerLanguage;
}

export function LanguageToggleClient({ current }: Props) {
  const pathname = usePathname() ?? "/app/home";
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pick(lang: WorkerLanguage) {
    if (lang === current || isPending) return;
    startTransition(async () => {
      await setLanguagePreference({ language: lang });
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("lang", lang);
      window.location.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex shrink-0 rounded-full border border-[color:var(--dc-edge)] bg-dc-raised p-0.5"
    >
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          aria-pressed={current === l}
          // The visible pill is compact (32px tall, 36px wide) but the
          // padding around the inner text keeps the actual hit area at
          // 44x44 — WCAG / glove-friendly. Don't drop the inner padding.
          className={[
            "relative flex h-8 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors",
            "before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']",
            current === l
              ? "bg-(--color-brand) text-white"
              : "text-dc-text-2 hover:text-dc-text",
          ].join(" ")}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

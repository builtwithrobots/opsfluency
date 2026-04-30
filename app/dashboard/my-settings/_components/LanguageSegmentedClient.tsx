"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLanguagePreference } from "@/app/dashboard/sops/_actions";
import type { WorkerLanguage } from "@/lib/types/sop";

interface Props {
  current: WorkerLanguage;
}

const LABELS: Record<WorkerLanguage, string> = {
  en: "English",
  es: "Español",
};

export function LanguageSegmentedClient({ current }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function pick(lang: WorkerLanguage) {
    if (lang === current || isPending) return;
    startTransition(async () => {
      const result = await setLanguagePreference({ language: lang });
      if (!result.ok) return;
      router.replace("/dashboard/my-settings?tab=preferences&saved=1");
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Dashboard language"
      className="inline-flex shrink-0 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised p-0.5"
    >
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          aria-pressed={current === l}
          disabled={isPending}
          className={[
            "relative h-9 min-w-24 rounded px-4 text-xs font-semibold tracking-wide uppercase transition-colors",
            current === l
              ? "bg-(--color-brand) text-white"
              : "text-dc-text-2 hover:text-dc-text",
            isPending && "opacity-60",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}

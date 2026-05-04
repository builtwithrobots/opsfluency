"use client";

import { useState, useTransition, type ReactNode } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

import { updateSopTemplate } from "@/app/dashboard/sops/_actions";
import type { SopTemplate } from "@/lib/types/sop";
import type { TemplateRecommendation } from "@/lib/ai/template-recommender";

interface TemplateInfo {
  key: SopTemplate;
  label: string;
  description: string;
  bestFor: string;
  icon: ReactNode;
  accentClass: string;
  borderClass: string;
  bgClass: string;
}

const TEMPLATES: TemplateInfo[] = [
  {
    key: "step-by-step",
    label: "Step-by-step",
    description: "Numbered steps, sequential flow, warning callouts between steps",
    bestFor: "Machine operation, procedures, safety protocols",
    icon: (
      <div className="flex flex-col gap-0.5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-1">
            <div className="flex size-3.5 items-center justify-center rounded-full bg-(--color-brand) text-[8px] font-bold text-white leading-none">{n}</div>
            <div className="h-1 w-5 rounded bg-(--color-brand)/30" />
          </div>
        ))}
      </div>
    ),
    accentClass: "text-(--color-brand)",
    borderClass: "border-(--color-brand)",
    bgClass: "bg-(--color-brand)/5",
  },
  {
    key: "reference",
    label: "Reference",
    description: "Table of contents, section headers, lookup-friendly layout",
    bestFor: "Specs, guidelines, policies, equipment manuals",
    icon: (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <div className="h-1 w-6 rounded bg-sky-400/40" />
        </div>
        <div className="flex items-center gap-1 pl-2">
          <div className="h-1 w-4 rounded bg-sky-400/30" />
        </div>
        <div className="flex items-center gap-1 pl-2">
          <div className="h-1 w-5 rounded bg-sky-400/30" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <div className="h-1 w-4 rounded bg-sky-400/40" />
        </div>
      </div>
    ),
    accentClass: "text-sky-400",
    borderClass: "border-sky-400",
    bgClass: "bg-sky-500/5",
  },
  {
    key: "safety-checklist",
    label: "Safety checklist",
    description: "Checkbox format, hazard header, prominent warning callouts",
    bestFor: "Pre-shift checks, compliance, inspections, LOTO",
    icon: (
      <div className="flex flex-col gap-1">
        {[true, false, false].map((checked, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`size-3 rounded border ${checked ? "border-red-400 bg-red-400/20" : "border-dc-text-3"} flex items-center justify-center`}>
              {checked && <div className="h-0.5 w-1.5 rounded-full bg-red-400" />}
            </div>
            <div className="h-1 w-5 rounded bg-dc-text-3/30" />
          </div>
        ))}
      </div>
    ),
    accentClass: "text-red-400",
    borderClass: "border-red-400",
    bgClass: "bg-red-500/5",
  },
  {
    key: "onboarding",
    label: "Onboarding",
    description: "Welcome header, welcoming tone, contact cards at bottom",
    bestFor: "New hire guides, role introductions, first-day orientation",
    icon: (
      <div className="flex flex-col items-center gap-1">
        <div className="size-5 rounded-full border-2 border-emerald-400/50 bg-emerald-500/10" />
        <div className="flex gap-1">
          <div className="h-1 w-3 rounded bg-emerald-400/30" />
          <div className="h-1 w-3 rounded bg-emerald-400/30" />
        </div>
      </div>
    ),
    accentClass: "text-emerald-400",
    borderClass: "border-emerald-400",
    bgClass: "bg-emerald-500/5",
  },
];

interface TemplatePickerClientProps {
  sopId: string;
  currentTemplate: SopTemplate | null;
  recommendation: TemplateRecommendation | null;
}

export function TemplatePickerClient({
  sopId,
  currentTemplate,
  recommendation,
}: TemplatePickerClientProps) {
  const [selected, setSelected] = useState<SopTemplate | null>(currentTemplate);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSelect(key: SopTemplate) {
    if (isPending || key === selected) return;
    setError(null);
    setSelected(key);

    startTransition(async () => {
      const result = await updateSopTemplate({ sop_id: sopId, template: key });
      if (!result.ok) {
        setSelected(currentTemplate);
        setError("Failed to save — try again.");
      }
    });
  }

  const effective = selected ?? recommendation?.recommended ?? null;

  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-dc-text">Display template</p>
          <p className="mt-0.5 text-xs text-dc-text-3">
            Controls how this SOP looks for workers — same content, different layout.
          </p>
        </div>
        {isPending && (
          <span className="text-xs text-dc-text-3">Saving…</span>
        )}
      </div>

      {/* AI recommendation rationale */}
      {recommendation && (
        <div className={`mb-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 ${
          recommendation.confidence === "high"
            ? "border-(--color-brand)/25 bg-(--color-brand)/5"
            : "border-[color:var(--dc-edge)] bg-dc-raised"
        }`}>
          <Sparkles className={`mt-0.5 size-3.5 shrink-0 ${
            recommendation.confidence === "high" ? "text-(--color-brand)" : "text-dc-text-3"
          }`} strokeWidth={2} />
          <p className="text-xs text-dc-text-2 leading-relaxed">
            <span className={`font-semibold ${recommendation.confidence === "high" ? "text-(--color-brand)" : "text-dc-text"}`}>
              {recommendation.confidence === "high" ? "Claude recommends" : "Claude suggests"}{" "}
              {TEMPLATES.find((t) => t.key === recommendation.recommended)?.label}
            </span>
            {" — "}
            {recommendation.reason}
          </p>
        </div>
      )}

      {/* 2×2 template grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TEMPLATES.map((t) => {
          const isSelected = effective === t.key;
          const isRecommended = recommendation?.recommended === t.key;

          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleSelect(t.key)}
              disabled={isPending}
              className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand) ${
                isSelected
                  ? `${t.borderClass} ${t.bgClass} shadow-sm`
                  : "border-[color:var(--dc-edge)] bg-dc-surface hover:border-[color:var(--dc-edge-hover,var(--dc-edge))] hover:bg-dc-raised"
              } ${isPending ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Recommendation pill */}
              {isRecommended && !isSelected && (
                <span className="absolute -top-2 left-3 flex items-center gap-1 rounded-full border border-(--color-brand)/30 bg-dc-surface px-2 py-0.5 text-[10px] font-semibold text-(--color-brand)">
                  <Sparkles className="size-2.5" strokeWidth={2.5} />
                  AI pick
                </span>
              )}
              {isSelected && (
                <span className="absolute -top-2 right-3">
                  <CheckCircle2 className={`size-4 ${t.accentClass}`} strokeWidth={2} />
                </span>
              )}

              {/* Icon */}
              <div className="mb-3 flex h-10 w-10 items-center justify-center">
                {t.icon}
              </div>

              {/* Labels */}
              <p className={`text-sm font-semibold ${isSelected ? t.accentClass : "text-dc-text"}`}>
                {t.label}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-dc-text-3">
                {t.description}
              </p>

              {/* Best-for tooltip on hover */}
              <p className="mt-2 text-[10px] leading-snug text-dc-text-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {t.bestFor}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

"use client";

import { Search } from "lucide-react";

import clsx from "clsx";

import { STYLE_LABELS, type SopStarterTemplate } from "@/lib/templates/index";

type StyleFilter = SopStarterTemplate["style"] | "all";

const TABS: { value: StyleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "step-by-step", label: STYLE_LABELS["step-by-step"] },
  { value: "reference", label: STYLE_LABELS["reference"] },
  { value: "safety-checklist", label: STYLE_LABELS["safety-checklist"] },
];

interface Props {
  style: StyleFilter;
  q: string;
  onStyleChange: (style: StyleFilter) => void;
  onQChange: (q: string) => void;
}

export function TemplateControls({ style, q, onStyleChange, onQChange }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Style filter tabs */}
      <div role="tablist" aria-label="Filter by template style" className="flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={style === tab.value}
            onClick={() => onStyleChange(tab.value)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)",
              style === tab.value
                ? "bg-(--color-brand) text-white"
                : "bg-dc-raised text-dc-text-2 hover:bg-(--color-brand)/10 hover:text-(--color-brand)"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dc-text-3"
          strokeWidth={1.75}
          aria-hidden
        />
        <label htmlFor="template-search" className="sr-only">
          Search templates
        </label>
        <input
          id="template-search"
          type="search"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search templates…"
          className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised py-2 pr-3 pl-9 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
        />
      </div>
    </div>
  );
}

"use client";

import { Download, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { STYLE_LABELS, type SopStarterTemplate } from "@/lib/templates/index";

const STYLE_COLORS = {
  "step-by-step": "blue",
  "reference": "violet",
  "safety-checklist": "amber",
} as const satisfies Record<SopStarterTemplate["style"], string>;

interface Props {
  template: SopStarterTemplate;
}

export function TemplateCard({ template }: Props) {
  return (
    <article className="group flex flex-col rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge color={STYLE_COLORS[template.style]}>
              {STYLE_LABELS[template.style]}
            </Badge>
            <Badge color="zinc">{template.category}</Badge>
          </div>
          <h2 className="text-sm/5 font-semibold text-dc-text">{template.title}</h2>
        </div>
        <div className="mt-0.5 shrink-0 rounded-lg bg-dc-raised p-2 text-dc-text-3">
          <FileText className="size-5" strokeWidth={1.5} aria-hidden />
        </div>
      </div>

      <p className="mt-2 grow text-xs/5 text-dc-text-2">{template.description}</p>

      <a
        href={`/templates/${template.filename}`}
        download={template.filename}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-4 py-2 text-xs font-medium text-dc-text transition-colors hover:bg-(--color-brand)/10 hover:border-(--color-brand) hover:text-(--color-brand) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)"
        aria-label={`Download ${template.title} template`}
      >
        <Download className="size-3.5" strokeWidth={2} aria-hidden />
        Download .docx
      </a>
    </article>
  );
}

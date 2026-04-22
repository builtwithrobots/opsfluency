// v1.0.0
// Features section 01: SOP import and AI conversion. Mockup shows a
// document icon on the left, an arrow, and a structured document on
// the right to represent the conversion flow.

import { ArrowRight, FileText, Sparkles } from "lucide-react";

import { FeatureDetailRow } from "./FeatureDetailRow";

export function FeatureSOPImport() {
  return (
    <FeatureDetailRow
      id="sop-import"
      headingId="features-sop-import-heading"
      side="right"
      eyebrow="01 - SOP import"
      icon={<FileText className="h-5 w-5" strokeWidth={2} />}
      title="Upload any doc. Claude rewrites it into clean Markdown."
      description="Your existing procedures probably live in PDFs, Word docs, or a text file nobody can find. Drop them in. Claude Sonnet reads the original, preserves the structure and warnings, and produces clean bilingual-ready Markdown."
      bullets={[
        "Accepts PDF, DOCX, and TXT out of the box.",
        "Preserves numbered steps, tables, and safety callouts.",
        "No template required. Your doc, your structure.",
      ]}
      mockupLabel="upload a PDF, AI rewrites it into clean Markdown"
      mockup={
        <div className="mt-10 flex h-full items-center justify-center gap-4 md:gap-6">
          <div className="flex aspect-[3/4] w-24 flex-col justify-between rounded border border-dc-edge-2 bg-dc-surface p-2 md:w-32 md:p-3">
            <div className="h-1 w-1/2 rounded-full bg-dc-edge-2" />
            <div className="flex flex-col gap-1">
              <div className="h-0.5 w-full rounded-full bg-dc-edge-2" />
              <div className="h-0.5 w-5/6 rounded-full bg-dc-edge-2" />
              <div className="h-0.5 w-3/4 rounded-full bg-dc-edge-2" />
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider text-dc-text-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              .PDF
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 text-[var(--color-brand)]">
            <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            <ArrowRight className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="flex aspect-[3/4] w-24 flex-col justify-between rounded border border-[var(--color-brand)] bg-dc-surface p-2 md:w-32 md:p-3">
            <div className="h-1 w-3/4 rounded-full bg-[var(--color-brand)]" />
            <div className="flex flex-col gap-1">
              <div className="h-0.5 w-full rounded-full bg-dc-edge-2" />
              <div className="h-0.5 w-5/6 rounded-full bg-dc-edge-2" />
              <div className="h-1.5 w-1/2 rounded-sm bg-[color-mix(in_srgb,var(--color-signal-warn)_30%,transparent)]" />
              <div className="h-0.5 w-full rounded-full bg-dc-edge-2" />
              <div className="h-0.5 w-2/3 rounded-full bg-dc-edge-2" />
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-brand)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              .MD
            </span>
          </div>
        </div>
      }
    />
  );
}

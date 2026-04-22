// v1.0.0
// Features section 03: bilingual publishing. Mockup shows side-by-side
// English and Spanish SOP columns with a language toggle chip.

import { Languages } from "lucide-react";

import { FeatureDetailRow } from "./FeatureDetailRow";

export function FeatureBilingualPublishing() {
  return (
    <FeatureDetailRow
      id="bilingual-publishing"
      headingId="features-bilingual-heading"
      side="right"
      eyebrow="03 - Bilingual publishing"
      icon={<Languages className="h-5 w-5" strokeWidth={2} />}
      title="English and Spanish, approved by you, served instantly."
      description="Google Cloud Translation does the heavy lifting with your glossary as context. You review the Spanish once before publish. Workers see both versions on the same SOP and can toggle without leaving the page."
      bullets={[
        "Translation runs on publish, not on every page load.",
        "Manager approval is a hard gate before going live.",
        "English edits flag the Spanish for re-review automatically.",
      ]}
      mockupLabel="side-by-side English and Spanish SOP with a language toggle"
      mockup={
        <div className="mt-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-6 items-center rounded-full border border-[var(--color-brand)] bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] px-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-brand)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              EN
            </span>
            <span
              className="inline-flex h-6 items-center rounded-full border border-dc-edge-2 bg-dc-surface px-2.5 text-[10px] font-semibold uppercase tracking-widest text-dc-text-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ES
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2 rounded border border-dc-edge bg-dc-surface p-3">
              <div className="h-1.5 w-2/3 rounded-full bg-dc-text-2" />
              <div className="flex flex-col gap-1 pt-1">
                <div className="h-0.5 w-full rounded-full bg-dc-edge-2" />
                <div className="h-0.5 w-5/6 rounded-full bg-dc-edge-2" />
                <div className="h-0.5 w-4/6 rounded-full bg-dc-edge-2" />
              </div>
              <div className="mt-2 h-1.5 w-1/3 rounded-sm bg-[color-mix(in_srgb,var(--color-signal-warn)_30%,transparent)]" />
              <div className="flex flex-col gap-1 pt-1">
                <div className="h-0.5 w-full rounded-full bg-dc-edge-2" />
                <div className="h-0.5 w-3/4 rounded-full bg-dc-edge-2" />
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded border border-dc-edge bg-dc-surface p-3">
              <div className="h-1.5 w-3/4 rounded-full bg-dc-text-2" />
              <div className="flex flex-col gap-1 pt-1">
                <div className="h-0.5 w-full rounded-full bg-dc-edge-2" />
                <div className="h-0.5 w-5/6 rounded-full bg-dc-edge-2" />
                <div className="h-0.5 w-2/3 rounded-full bg-dc-edge-2" />
              </div>
              <div className="mt-2 h-1.5 w-2/5 rounded-sm bg-[color-mix(in_srgb,var(--color-signal-warn)_30%,transparent)]" />
              <div className="flex flex-col gap-1 pt-1">
                <div className="h-0.5 w-full rounded-full bg-dc-edge-2" />
                <div className="h-0.5 w-3/5 rounded-full bg-dc-edge-2" />
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

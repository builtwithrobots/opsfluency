// v1.0.0
// Features section 08: scan analytics. Mockup shows a simple bar chart
// of scans per day with a language split indicator.

import { BarChart3 } from "lucide-react";

import { FeatureDetailRow } from "./FeatureDetailRow";

const BARS = [42, 61, 53, 78, 90, 64, 72];

export function FeatureScanAnalytics() {
  const max = Math.max(...BARS);

  return (
    <FeatureDetailRow
      id="scan-analytics"
      headingId="features-analytics-heading"
      side="left"
      eyebrow="08 - Scan analytics"
      icon={<BarChart3 className="h-5 w-5" strokeWidth={2} />}
      title="See who scanned what, when, and in which language."
      description="Every scan is logged. Roll it up by SOP, by worker, by department, by language. Spot procedures nobody is reading, workers who need follow-up, shifts where a new hire got stuck on the same step twice."
      bullets={[
        "Per-SOP scan counts with English vs Spanish breakdown.",
        "Worker-level activity timeline (privacy-scoped to managers only).",
        "Daily and weekly rollups exportable as CSV.",
      ]}
      mockupLabel="bar chart of scans per day with English and Spanish split"
      mockup={
        <div className="mt-10 flex flex-col gap-3">
          <div className="flex items-center gap-4 text-[10px] text-dc-text-2">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-sm bg-[var(--color-brand)]"
              />
              <span
                className="font-semibold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                EN
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-sm bg-[var(--color-signal-live)]"
              />
              <span
                className="font-semibold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ES
              </span>
            </span>
            <span
              className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-dc-text-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Last 7 days
            </span>
          </div>
          <div className="flex h-40 items-end gap-2" role="presentation">
            {BARS.map((value, index) => {
              const enPct = (value * 0.6) / max;
              const esPct = (value * 0.4) / max;
              return (
                <div key={index} className="flex flex-1 flex-col items-stretch justify-end">
                  <div
                    className="w-full rounded-t-sm bg-[var(--color-signal-live)]"
                    style={{ height: `${esPct * 100}%` }}
                  />
                  <div
                    className="w-full bg-[var(--color-brand)]"
                    style={{ height: `${enPct * 100}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div
            className="flex items-center justify-between text-[10px] text-dc-text-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>
        </div>
      }
    />
  );
}

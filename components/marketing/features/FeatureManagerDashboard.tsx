// v1.0.0
// Features section 09: manager dashboard. Mockup shows a sidebar plus
// content area with a short list of SOPs in different statuses.

import { LayoutDashboard } from "lucide-react";

import { FeatureDetailRow } from "./FeatureDetailRow";

type StatusKey = "published" | "pending_translation" | "pending_terms" | "draft";

type SopRow = { title: string; status: StatusKey };

const ROWS: SopRow[] = [
  { title: "Lockout: dock door 7", status: "published" },
  { title: "Roller cage inspection", status: "pending_translation" },
  { title: "PPE bin restock", status: "pending_terms" },
  { title: "New hire Day 1", status: "draft" },
];

const STATUS_COLOR: Record<StatusKey, string> = {
  published: "var(--color-signal-ok)",
  pending_translation: "var(--color-signal-warn)",
  pending_terms: "var(--color-signal-info)",
  draft: "var(--color-signal-neutral)",
};

const STATUS_LABEL: Record<StatusKey, string> = {
  published: "live",
  pending_translation: "translation",
  pending_terms: "terms",
  draft: "draft",
};

export function FeatureManagerDashboard() {
  return (
    <FeatureDetailRow
      id="manager-dashboard"
      headingId="features-dashboard-heading"
      side="right"
      eyebrow="09 - Manager dashboard"
      icon={<LayoutDashboard className="h-5 w-5" strokeWidth={2} />}
      title="Every SOP, worker, announcement, and monitor in one view."
      description="Status lifecycle is visible at a glance. Published, pending translation, pending terms, draft. You always know where everything is and what needs your attention next."
      bullets={[
        "SOP list with status pills and last-updated timestamps.",
        "Worker roster with preferred language and last-active column.",
        "Announcement composer with department targeting.",
      ]}
      mockupLabel="manager dashboard with SOP list and status pills"
      mockup={
        <div className="mt-10 flex gap-3">
          <div className="flex w-20 flex-col gap-1.5 rounded border border-dc-edge bg-dc-surface p-2">
            <div className="h-1.5 w-full rounded-full bg-[var(--color-brand)]" />
            <div className="h-1 w-3/4 rounded-full bg-dc-edge-2" />
            <div className="h-1 w-4/5 rounded-full bg-dc-edge-2" />
            <div className="h-1 w-2/3 rounded-full bg-dc-edge-2" />
            <div className="h-1 w-3/4 rounded-full bg-dc-edge-2" />
            <div className="h-1 w-3/5 rounded-full bg-dc-edge-2" />
          </div>
          <div className="flex flex-1 flex-col gap-2 rounded border border-dc-edge bg-dc-surface p-3">
            <div className="flex items-center justify-between">
              <div className="h-1.5 w-20 rounded-full bg-dc-text" />
              <div className="h-4 w-14 rounded bg-[var(--color-brand)]" />
            </div>
            {ROWS.map((row) => (
              <div
                key={row.title}
                className="flex items-center justify-between gap-2 border-b border-dc-edge py-1.5 last:border-b-0"
              >
                <span className="truncate text-[11px] text-dc-text">{row.title}</span>
                <span
                  className="inline-flex h-4 items-center rounded-full border px-2 text-[9px] font-semibold uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-mono)",
                    borderColor: `color-mix(in srgb, ${STATUS_COLOR[row.status]} 25%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${STATUS_COLOR[row.status]} 12%, transparent)`,
                    color: STATUS_COLOR[row.status],
                  }}
                >
                  {STATUS_LABEL[row.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}

// v2.0.0
// Roadmap. Blueprint refresh: ghost numeral "04", section border-top,
// two framed cards side by side with animated status dots.

import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "about-roadmap-heading";

type Bucket = {
  label: string;
  state: "live" | "next";
  items: string[];
};

const BUCKETS: Bucket[] = [
  {
    label: "Shipping now",
    state: "live",
    items: [
      "Bilingual SOPs (English + Spanish)",
      "AI conversion with glossary flagging",
      "QR-triggered learning",
      "Worker PWA with magic-link sign-in",
      "Monitor displays and departmental announcements",
      "HR module with contacts and chat",
      "Scan analytics",
    ],
  },
  {
    label: "Next on the list",
    state: "next",
    items: [
      "Vietnamese, Mandarin, Portuguese, Arabic",
      "Loom and Scribe integrations for video SOPs",
      "Voice search in the worker's native language",
      "HRIS integrations (ADP, Paychex, Gusto)",
      "Required-reading assignments with completion tracking",
      "Production management board monitor module",
    ],
  },
];

export function AboutRoadmap() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="border-t border-dc-edge py-12 md:py-16"
    >
      <Container className="flex flex-col gap-10">
        <BlueprintSectionHeader
          numeral="04"
          kicker="Roadmap"
          heading="What is live, and what is next."
          id={HEADING_ID}
        />
        <div className="grid gap-5 md:grid-cols-2 max-w-3xl">
          {BUCKETS.map((bucket) => {
            const isLive = bucket.state === "live";
            return (
              <FramedPanel key={bucket.label} className="flex flex-col gap-4 p-6">
                {/* Status badge */}
                <span
                  className="inline-flex items-center gap-2 self-start rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{
                    background: isLive
                      ? "color-mix(in srgb, var(--color-signal-ok) 12%, transparent)"
                      : "color-mix(in srgb, var(--color-signal-warn) 12%, transparent)",
                    color: isLive
                      ? "var(--color-signal-ok)"
                      : "var(--color-signal-warn)",
                    border: isLive
                      ? "1px solid color-mix(in srgb, var(--color-signal-ok) 25%, transparent)"
                      : "1px solid color-mix(in srgb, var(--color-signal-warn) 25%, transparent)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "inline-block h-1.5 w-1.5 rounded-full shrink-0",
                      isLive
                        ? "bg-[var(--color-signal-ok)] animate-heartbeat"
                        : "bg-[var(--color-signal-warn)] animate-calm-pulse",
                    ].join(" ")}
                  />
                  {bucket.label}
                </span>

                <ul className="flex flex-col gap-2 text-sm text-dc-text-2">
                  {bucket.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--color-brand)]"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </FramedPanel>
            );
          })}
        </div>
      </Container>
    </MotionSection>
  );
}

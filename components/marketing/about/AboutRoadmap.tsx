// v1.0.0
// Short roadmap view. MVP today, Phase 2 next. Prose container,
// two-column vertical list with a dividing rule between them.

import { Container } from "@/components/marketing/Container";
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
      className="py-12 md:py-16"
    >
      <Container width="prose" className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span
            className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Roadmap
          </span>
          <h2
            id={HEADING_ID}
            className="text-3xl font-semibold tracking-tight text-dc-text md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What is live, and what is next.
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {BUCKETS.map((bucket) => {
            const liveDotClass =
              bucket.state === "live"
                ? "bg-[var(--color-signal-ok)] animate-heartbeat"
                : "bg-[var(--color-signal-warn)] animate-calm-pulse";
            return (
              <div key={bucket.label} className="flex flex-col gap-3">
                <span
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-dc-text-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-1.5 w-1.5 rounded-full ${liveDotClass}`}
                  />
                  {bucket.label}
                </span>
                <ul className="flex flex-col gap-2 text-base text-dc-text-2">
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
              </div>
            );
          })}
        </div>
      </Container>
    </MotionSection>
  );
}

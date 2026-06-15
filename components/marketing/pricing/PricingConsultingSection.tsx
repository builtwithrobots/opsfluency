// v1.0.0
// Consulting engagement cards. Three cards -- Operations Consulting,
// Fractional Ops Leadership (featured), Custom App Solutions -- without
// prices (all custom-quoted). Numeral "01" Blueprint section.

import { ArrowRight } from "lucide-react";

import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "pricing-consulting-heading";

type EngagementCard = {
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  featured?: boolean;
  badge?: string;
};

const CARDS: EngagementCard[] = [
  {
    tag: "S1",
    title: "Operations Consulting",
    description:
      "A focused project with a defined scope: a diagnostic, a process redesign, a compliance gap, or a specific initiative your team is stuck on.",
    bullets: [
      "Half-day on-site discovery with written findings report",
      "Defined deliverables and timeline before work starts",
      "Fixed or daily rate -- no open-ended retainer",
      "You keep everything regardless of whether we continue",
    ],
  },
  {
    tag: "S2",
    title: "Fractional Ops Leadership",
    description:
      "Part-time embedded leadership for teams that need a seasoned ops head but not a full-time hire.",
    bullets: [
      "Typically one to two days on-site per week",
      "Direct access -- not a project coordinator",
      "Manages to your team's existing goals",
      "Scales down as your internal capacity grows",
    ],
    featured: true,
    badge: "Most requested",
  },
  {
    tag: "S3",
    title: "Custom App Solutions",
    description:
      "Lightweight internal tools built to your exact workflow. One problem, one tool, no bloat.",
    bullets: [
      "Scoped to the narrowest solution that actually solves it",
      "Built on the same stack as OpsFluency -- proven and maintainable",
      "Handed off with documentation your team can run",
      "Option to extend or hand back for ongoing support",
    ],
  },
];

export function PricingConsultingSection() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="border-t border-dc-edge py-12 md:py-16"
    >
      <Container className="flex flex-col gap-10">
        <BlueprintSectionHeader
          numeral="01"
          kicker="Consulting"
          heading="Engagements are custom-quoted."
          subhead="Every operation is different. Scope, duration, and rate depend on what you need and where you are. All engagements start with a free 30-minute conversation."
          id={HEADING_ID}
        />

        <div className="grid gap-5 md:grid-cols-3 max-w-5xl">
          {CARDS.map((card) => (
            <FramedPanel
              key={card.tag}
              featured={card.featured}
              className={[
                "flex flex-col gap-4 p-6",
                card.featured ? "md:-translate-y-1" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {card.tag}
                </span>
                {card.badge ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white"
                    style={{
                      background: "var(--color-brand)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {card.badge}
                  </span>
                ) : null}
              </div>

              <h3
                className="text-lg font-semibold text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {card.title}
              </h3>

              <p className="text-sm leading-relaxed text-dc-text-2">
                {card.description}
              </p>

              <span
                aria-hidden="true"
                className="block h-px w-full"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, var(--color-dc-edge-2) 0 7px, transparent 7px 14px)",
                }}
              />

              <ul className="flex flex-col gap-2">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--color-brand)]"
                    />
                    <span className="text-sm leading-relaxed text-dc-text-2">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-2">
                <Button
                  href="/contact"
                  size="md"
                  fullWidth
                  trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
                >
                  Talk to Rob
                </Button>
              </div>
            </FramedPanel>
          ))}
        </div>
      </Container>
    </MotionSection>
  );
}

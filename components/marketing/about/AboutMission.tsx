// v1.0.0
// Three-part mission. Prose container, plain list, no cards.

import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "about-mission-heading";

type Pillar = { title: string; body: string };

const PILLARS: Pillar[] = [
  {
    title: "Eliminate the training burden",
    body: "Supervisors lose seventeen hours a week re-explaining procedures. The first job of this product is to give those hours back, so managers can manage and workers can actually do the work they were hired for.",
  },
  {
    title: "Create worker accountability",
    body: "When a worker has scanned the SOP, read it in their language, and signed off, they own the outcome. The point of bilingual publishing is not politeness. It is to remove the last excuse for not knowing how to do the job.",
  },
  {
    title: "Stop embarrassment-driven quits",
    body: "Nobody leaves a job they feel competent at. Our bar for every feature: does this make a worker more confident on the floor, or more capable of asking for help without feeling small?",
  },
];

export function AboutMission() {
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
            Mission
          </span>
          <h2
            id={HEADING_ID}
            className="text-3xl font-semibold tracking-tight text-dc-text md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Three things we are trying to accomplish.
          </h2>
        </div>
        <ol className="flex flex-col gap-8">
          {PILLARS.map((pillar, index) => (
            <li key={pillar.title} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-4">
                <span
                  aria-hidden="true"
                  className="text-xl font-bold tabular-nums text-[var(--color-brand)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  0{index + 1}
                </span>
                <h3
                  className="text-xl font-semibold text-dc-text md:text-2xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {pillar.title}
                </h3>
              </div>
              <p className="pl-10 text-base leading-relaxed text-dc-text-2 md:text-lg">
                {pillar.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </MotionSection>
  );
}

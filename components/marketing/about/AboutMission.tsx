// v2.0.0
// Three-part mission. Blueprint refresh: ghost numeral "02", section
// border-top, numbered framed cards.

import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
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
      className="border-t border-dc-edge py-12 md:py-16"
    >
      <Container className="flex flex-col gap-10">
        <BlueprintSectionHeader
          numeral="02"
          kicker="Mission"
          heading="Three things we are trying to accomplish."
          id={HEADING_ID}
        />
        <ol className="grid gap-5 md:grid-cols-3 max-w-5xl">
          {PILLARS.map((pillar, index) => (
            <FramedPanel key={pillar.title} as="li" className="flex flex-col gap-4 p-6">
              <span
                aria-hidden="true"
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {`0${index + 1}`}
              </span>
              <h3
                className="text-base font-semibold text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {pillar.title}
              </h3>
              <p className="text-sm leading-relaxed text-dc-text-2">
                {pillar.body}
              </p>
            </FramedPanel>
          ))}
        </ol>
      </Container>
    </MotionSection>
  );
}

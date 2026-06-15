// v1.0.0
// Tools page hero. Eyebrow + headline + subhead. Brief -- the
// platform card below carries the detail.

import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "tools-heading";

export function ToolsHero() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="py-20 md:py-28"
    >
      <Container className="flex flex-col gap-6">
        <MotionSectionItem>
          <span
            className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tools
          </span>
        </MotionSectionItem>
        <MotionSectionItem>
          <h1
            id={HEADING_ID}
            className="max-w-3xl text-5xl font-bold tracking-tight text-dc-text md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Built because they did not exist.
          </h1>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="max-w-2xl text-lg leading-relaxed text-dc-text-2 md:text-xl">
            Every tool I use with clients started as a problem I could not solve
            with what was available. OpsFluency is the first. More are coming.
          </p>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

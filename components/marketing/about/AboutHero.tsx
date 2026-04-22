// v1.0.0
// About hero. Prose container (max-w-2xl) per the About override.
// No CTAs, no visual: the page is prose.

import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";
import { MotionSectionItem } from "@/components/motion/MotionSection";

export function AboutHero() {
  return (
    <MotionSection
      aria-label="About"
      variants={staggerContainer}
      className="py-20 md:py-28"
    >
      <Container width="prose" className="flex flex-col gap-6">
        <MotionSectionItem>
          <span
            className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            About
          </span>
        </MotionSectionItem>
        <MotionSectionItem>
          <h1
            className="text-4xl font-bold tracking-tight text-dc-text md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Built by an operator, for operators.
          </h1>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="text-lg leading-relaxed text-dc-text-2 md:text-xl">
            OpsFluency is not a venture-backed AI moonshot. It is an operations tool built by someone who spent twenty years watching the same preventable failure happen on the warehouse floor, and decided to fix it.
          </p>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

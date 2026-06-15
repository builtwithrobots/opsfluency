// v1.0.0
// What I Do hero. Eyebrow + headline + subhead. Sets the frame
// before the four service cards below.

import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "what-i-do-heading";

export function WhatIDoHero() {
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
            What I Do
          </span>
        </MotionSectionItem>
        <MotionSectionItem>
          <h1
            id={HEADING_ID}
            className="max-w-3xl text-5xl font-bold tracking-tight text-dc-text md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Four ways to work together.
          </h1>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="max-w-2xl text-lg leading-relaxed text-dc-text-2 md:text-xl">
            Every engagement is different. Some clients need a consultant. Some
            need the platform. Some need both. Some need something built from
            scratch. The first call figures out which one fits.
          </p>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

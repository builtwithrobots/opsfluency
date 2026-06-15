// v1.0.0
// What I Do final CTA. Not sure which fits? That is what the first
// call is for.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

export function WhatIdoCTA() {
  return (
    <MotionSection
      aria-label="Talk to Rob"
      variants={staggerContainer}
      className="relative isolate overflow-hidden bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dim)] py-20 md:py-32"
    >
      <Container className="flex flex-col items-center gap-8 text-center text-white">
        <MotionSectionItem>
          <h2
            className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Not sure which fits?
          </h2>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="max-w-2xl text-lg leading-relaxed text-white/85">
            Most people who reach out are not sure which option is right yet.
            That is exactly what the first call figures out. No commitment, no
            pressure. Just an honest conversation about your operation.
          </p>
        </MotionSectionItem>
        <MotionSectionItem>
          <Button
            href="/contact"
            size="lg"
            className="bg-white text-[var(--color-brand-dim)] hover:bg-white/90"
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
          >
            Talk to Rob
          </Button>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

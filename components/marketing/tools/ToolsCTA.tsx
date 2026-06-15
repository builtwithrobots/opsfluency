// v1.0.0
// Tools final CTA. Full-bleed teal gradient, Rob's direct close.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

export function ToolsCTA() {
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
            {"Let's talk about your operation."}
          </h2>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="max-w-xl text-lg leading-relaxed text-white/85">
            You are not talking to a receptionist or a sales rep. You are
            talking to Rob.
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

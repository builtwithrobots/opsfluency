// v2.0.0
// Consultancy final CTA. Full-bleed teal gradient, Rob's direct close,
// single "Talk to Rob →" CTA, trust line below. Custom layout rather
// than CTABlock because the copy uses two body paragraphs.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

export function HomeFinalCTA() {
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
        <MotionSectionItem className="flex max-w-2xl flex-col gap-4 text-lg leading-relaxed text-white/85 md:text-xl">
          <p>
            {"If you're reading this, you probably have a floor that's running harder than it needs to. Maybe it's a bilingual workforce and English-only SOPs. Maybe it's turnover you can't explain. Maybe it's an OSHA compliance gap you discovered after the near-miss."}
          </p>
          <p>{"I've seen all of it. I can help."}</p>
        </MotionSectionItem>
        <MotionSectionItem className="flex flex-col items-center gap-4">
          <Button
            href="/contact"
            size="lg"
            className="bg-white text-[var(--color-brand-dim)] hover:bg-white/90"
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
          >
            Talk to Rob
          </Button>
          <p className="text-sm text-white/70">
            No pitch deck. No sales cycle. One conversation about your operation.
          </p>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

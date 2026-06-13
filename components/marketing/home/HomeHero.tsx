// v2.0.0
// Consultancy homepage hero. Rob-first, centered layout with trust strip
// inline below the CTAs. Custom layout — does not use the generic Hero
// primitive because the trust strip belongs inside the same section.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const TRUST_ITEMS = [
  "22 years of operations experience",
  ">99% order accuracy across multiple facilities",
  "Zero lost-time incidents, every site",
] as const;

export function HomeHero() {
  return (
    <MotionSection
      aria-label="OpsFluency consultancy hero"
      variants={staggerContainer}
      className="py-20 md:py-32"
    >
      <Container className="flex flex-col items-center gap-8 text-center">
        <MotionSectionItem>
          <span
            className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            22 years of warehouse and manufacturing operations
          </span>
        </MotionSectionItem>
        <MotionSectionItem>
          <h1
            className="max-w-4xl text-5xl font-bold tracking-tight text-dc-text md:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your floor is running on tribal knowledge.
          </h1>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="max-w-2xl text-lg leading-relaxed text-dc-text-2 md:text-xl">
            {"I've spent 22 years fixing that — in warehouses, manufacturing plants, and 3PLs across the country. OpsFluency is how I do it now."}
          </p>
        </MotionSectionItem>
        <MotionSectionItem className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            href="/contact"
            size="lg"
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
          >
            Talk to Rob
          </Button>
          <Button href="https://app.opsfluency.com" variant="secondary" size="lg">
            See the Platform
          </Button>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="text-xs text-dc-text-3">
            {TRUST_ITEMS.join(" · ")}
          </p>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

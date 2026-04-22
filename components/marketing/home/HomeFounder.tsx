// v1.0.0
// Founder credibility section. Single pull quote using the MASTER
// section 2 pull-quote rule (Chakra Petch weight 500, 2px left border in
// brand). Link to /about for the full story.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-founder-heading";

export function HomeFounder() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="py-16 md:py-24"
    >
      <Container width="narrow" className="flex flex-col items-start gap-8">
        <MotionSectionItem>
          <span
            className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Built by an operator
          </span>
        </MotionSectionItem>
        <MotionSectionItem>
          <blockquote
            id={HEADING_ID}
            className="border-l-2 border-[var(--color-brand)] pl-6 text-2xl font-medium leading-snug text-dc-text md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Workers do not quit for fifty cents more per hour. They quit because they are frustrated and embarrassed. Twenty years of operations taught me that. OpsFluency is the fix.
          </blockquote>
        </MotionSectionItem>
        <MotionSectionItem>
          <p
            className="font-mono text-sm text-dc-text-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Rob, Founder. 20 years of operations leadership.
          </p>
        </MotionSectionItem>
        <MotionSectionItem>
          <Button
            href="/about"
            variant="ghost"
            size="md"
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
          >
            Read the story
          </Button>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

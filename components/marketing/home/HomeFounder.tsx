// v2.0.0
// Founder credibility section. Blueprint refresh: FramedPanel with corner
// ticks on the blockquote card, section border-top.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-founder-heading";

export function HomeFounder() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="border-t border-dc-edge py-16 md:py-24"
    >
      <Container width="narrow" className="flex flex-col gap-8">
        <MotionSectionItem>
          <span
            className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0"
              style={{ background: "var(--color-brand)" }}
            />
            Built by an operator
          </span>
        </MotionSectionItem>

        <MotionSectionItem>
          <FramedPanel withCornerTicks className="p-8 md:p-10">
            <blockquote
              id={HEADING_ID}
              className="border-l-2 border-[var(--color-brand)] pl-6 text-dc-text"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(20px,2.6vw,28px)",
                lineHeight: 1.3,
              }}
            >
              Workers do not quit for fifty cents more per hour. They quit
              because they are frustrated and embarrassed. Twenty years of
              operations taught me that. OpsFluency is the fix.
            </blockquote>
            <p
              className="mt-5 text-sm text-dc-text-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Rob · Founder · 20 years of operations leadership
            </p>
          </FramedPanel>
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

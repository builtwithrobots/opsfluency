// v2.0.0
// Blueprint refresh: left-aligned teal square kicker, clamp h1 sizing.

import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "pricing-hero-heading";

export function PricingHero() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="py-20 md:py-28"
    >
      <Container className="flex flex-col gap-6">
        <MotionSectionItem>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0"
              style={{ background: "var(--color-brand)" }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Pricing
            </span>
          </div>
        </MotionSectionItem>

        <MotionSectionItem>
          <h1
            id={HEADING_ID}
            className="max-w-2xl text-dc-text"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "clamp(34px,5vw,62px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Flat rate. No per-user fees.
          </h1>
        </MotionSectionItem>

        <MotionSectionItem>
          <p className="max-w-xl text-lg leading-relaxed text-dc-text-2">
            Growth is $119 a month on annual, $149 month-to-month. Your
            manager can expense that without a committee. Start on a 14-day
            free trial, no credit card.
          </p>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

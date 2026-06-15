// v2.0.0
// Blueprint refresh: teal square kicker, clamp h1 sizing, left-aligned.

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
              Tools
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
            Built because they did not exist.
          </h1>
        </MotionSectionItem>

        <MotionSectionItem>
          <p className="max-w-xl text-lg leading-relaxed text-dc-text-2">
            Every tool I use with clients started as a problem I could not solve
            with what was available. OpsFluency is the first. More are coming.
          </p>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

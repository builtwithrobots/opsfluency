// v3.0.0
// Blueprint refresh: left-aligned kicker + h1, no centred wrapper,
// no right visual (form below is the primary action). Matches the
// section heading style used across Home, Services, About.

import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

export function ContactHero() {
  return (
    <MotionSection
      aria-label="Contact"
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
              Contact
            </span>
          </div>
        </MotionSectionItem>

        <MotionSectionItem>
          <h1
            className="max-w-2xl text-dc-text"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "clamp(34px,5vw,62px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Talk to Rob.
          </h1>
        </MotionSectionItem>

        <MotionSectionItem>
          <p
            className="max-w-xl text-lg leading-relaxed text-dc-text-2"
          >
            You are not talking to a receptionist or a sales rep. You are
            talking to Rob.
          </p>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

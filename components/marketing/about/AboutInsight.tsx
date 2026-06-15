// v2.0.0
// The thesis statement. Blueprint refresh: FramedPanel with corner ticks,
// teal-tinted background, section border-top. Sharp corners per Blueprint.

import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "about-insight-heading";

export function AboutInsight() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="border-t border-dc-edge py-16 md:py-24"
    >
      <Container width="narrow">
        <FramedPanel
          withCornerTicks
          emphasis
          className="p-8 md:p-10 bg-[color-mix(in_srgb,var(--color-brand-50)_60%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-brand-dim)_15%,transparent)] border-[var(--color-brand)]"
        >
          <span
            className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0"
              style={{ background: "var(--color-brand)" }}
            />
            The thesis
          </span>
          <h2
            id={HEADING_ID}
            className="mt-4 text-3xl font-semibold leading-snug tracking-tight text-dc-text md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dignity and competence, not pay, is the real retention lever on the frontline.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-dc-text-2 md:text-lg">
            Every feature in OpsFluency earns its place against that single claim. If a feature makes workers more competent on Day 1, or stops a manager from re-explaining the same procedure twenty times, it ships. If it is impressive but does not move that needle, it does not.
          </p>
        </FramedPanel>
      </Container>
    </MotionSection>
  );
}

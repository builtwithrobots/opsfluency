// v1.0.0
// The thesis statement. Full-width teal-tinted callout. The color-mix
// values are the one deviation from the token set on this page
// (documented in the About page override).

import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "about-insight-heading";

export function AboutInsight() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="py-16 md:py-24"
    >
      <Container width="prose">
        <div className="rounded-xl border border-[var(--color-brand)] bg-[color-mix(in_srgb,var(--color-brand-50)_60%,transparent)] p-8 md:p-10 dark:bg-[color-mix(in_srgb,var(--color-brand-dim)_15%,transparent)]">
          <span
            className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
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
        </div>
      </Container>
    </MotionSection>
  );
}

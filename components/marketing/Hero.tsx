// v1.0.0
// Marketing hero primitive. Eyebrow + h1 + subhead + primary CTA +
// optional secondary CTA + optional visual slot. Children reveal
// with stagger via MotionSection.
//
// Layout:
//   - No visual: single centered column, max-w default from Container.
//   - With visual: two columns at lg+, text left and visual right, stacks
//     on smaller widths.
//
// The visual is rendered as-is; pages pass their own teal-tinted mockup
// block. The hero does not impose a visual style on the slot.

import type { ReactNode } from "react";

import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

type HeroProps = {
  eyebrow?: ReactNode;
  headline: ReactNode;
  subhead?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  visual?: ReactNode;
  ariaLabel: string;
  className?: string;
};

export function Hero({
  eyebrow,
  headline,
  subhead,
  primary,
  secondary,
  visual,
  ariaLabel,
  className,
}: HeroProps) {
  const hasVisual = Boolean(visual);

  const sectionClasses = [
    "py-20 md:py-32",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <MotionSection
      aria-label={ariaLabel}
      variants={staggerContainer}
      className={sectionClasses}
    >
      <Container
        className={
          hasVisual
            ? "grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
            : "flex flex-col items-center gap-6 text-center"
        }
      >
        <div
          className={
            hasVisual
              ? "flex flex-col gap-6"
              : "flex flex-col items-center gap-6"
          }
        >
          {eyebrow ? (
            <MotionSectionItem>
              <span
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {eyebrow}
              </span>
            </MotionSectionItem>
          ) : null}
          <MotionSectionItem>
            <h1
              className="max-w-3xl text-5xl font-bold tracking-tight text-dc-text md:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {headline}
            </h1>
          </MotionSectionItem>
          {subhead ? (
            <MotionSectionItem>
              <p className="max-w-2xl text-lg leading-relaxed text-dc-text-2 md:text-xl">
                {subhead}
              </p>
            </MotionSectionItem>
          ) : null}
          {primary || secondary ? (
            <MotionSectionItem
              className={
                hasVisual
                  ? "flex flex-wrap items-center gap-3 pt-2"
                  : "flex flex-wrap items-center justify-center gap-3 pt-2"
              }
            >
              {primary}
              {secondary}
            </MotionSectionItem>
          ) : null}
        </div>
        {hasVisual ? <MotionSectionItem>{visual}</MotionSectionItem> : null}
      </Container>
    </MotionSection>
  );
}

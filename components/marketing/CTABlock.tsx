// v1.0.0
// Full-bleed CTA block used at the bottom of every marketing page.
// Teal gradient from brand to brand-dim, white text, section-loose
// vertical rhythm. Wraps children in MotionSection so the block
// reveals on scroll.
//
// The gradient uses brand tokens only. No decorative hex values.

import type { ReactNode } from "react";

import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";

type CTABlockProps = {
  heading: ReactNode;
  subhead?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  ariaLabel?: string;
  className?: string;
};

export function CTABlock({
  heading,
  subhead,
  primary,
  secondary,
  ariaLabel = "Call to action",
  className,
}: CTABlockProps) {
  const sectionClasses = [
    "relative isolate overflow-hidden",
    "bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dim)]",
    "py-20 md:py-32",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <MotionSection aria-label={ariaLabel} className={sectionClasses}>
      <Container className="flex flex-col items-center gap-6 text-center text-white">
        <h2
          className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {heading}
        </h2>
        {subhead ? (
          <p className="max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
            {subhead}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {primary}
          {secondary}
        </div>
      </Container>
    </MotionSection>
  );
}

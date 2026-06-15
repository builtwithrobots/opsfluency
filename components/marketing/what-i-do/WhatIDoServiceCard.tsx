// v1.0.0
// Reusable service card for the What I Do page. Each card is a full-width
// section. 2-column layout: number + title + tagline on the left, full
// description + who-it's-for box + detail + CTA on the right.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

export type WhatIDoServiceCardProps = {
  number: string;
  title: string;
  tagline: string;
  description: string;
  whoItsFor: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
  raised?: boolean;
};

export function WhatIDoServiceCard({
  number,
  title,
  tagline,
  description,
  whoItsFor,
  detail,
  ctaLabel,
  ctaHref,
  ctaExternal,
  raised,
}: WhatIDoServiceCardProps) {
  const headingId = `service-${number}-heading`;

  return (
    <MotionSection
      aria-labelledby={headingId}
      variants={staggerContainer}
      className={[
        "border-b border-dc-edge py-16 last:border-b-0 md:py-24",
        raised ? "bg-dc-raised" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Container>
        <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
          {/* Left column: number + title + tagline */}
          <MotionSectionItem className="flex flex-col gap-4">
            <span
              className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {number}
            </span>
            <h2
              id={headingId}
              className="text-3xl font-bold tracking-tight text-dc-text md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h2>
            <p className="text-base italic leading-relaxed text-[var(--color-brand)]">
              {tagline}
            </p>
          </MotionSectionItem>

          {/* Right column: description + who-it's-for + detail + CTA */}
          <MotionSectionItem className="flex flex-col gap-6">
            <p className="text-base leading-relaxed text-dc-text-2 md:text-lg">
              {description}
            </p>

            <div className="flex flex-col gap-2 rounded-lg border border-dc-edge bg-dc-surface p-5">
              <span
                className="text-xs font-semibold uppercase tracking-widest text-dc-text-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {"Who it's for"}
              </span>
              <p className="text-sm leading-relaxed text-dc-text-2">
                {whoItsFor}
              </p>
            </div>

            <p className="text-sm italic text-dc-text-3">{detail}</p>

            <Button
              href={ctaHref}
              variant="secondary"
              size="md"
              {...(ctaExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
            >
              {ctaLabel}
            </Button>
          </MotionSectionItem>
        </div>
      </Container>
    </MotionSection>
  );
}

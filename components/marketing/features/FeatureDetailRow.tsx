// v1.0.0
// Shared two-column row for each Features page section. Alternates
// visual side via the `side` prop. Used by every FeatureX.tsx file so
// the layout, stagger, and mockup chrome stay consistent while each
// feature owns its own copy and mockup contents.
//
// The mockup wrapper is applied here (bg-dc-raised + border + corner
// tag); the section component passes the interior content.

import type { ReactNode } from "react";

import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

type Side = "left" | "right";

type FeatureDetailRowProps = {
  id: string;
  headingId: string;
  side: Side;
  eyebrow: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  bullets?: ReactNode[];
  mockup: ReactNode;
  mockupLabel: string;
};

export function FeatureDetailRow({
  id,
  headingId,
  side,
  eyebrow,
  icon,
  title,
  description,
  bullets,
  mockup,
  mockupLabel,
}: FeatureDetailRowProps) {
  return (
    <MotionSection
      id={id}
      aria-labelledby={headingId}
      variants={staggerContainer}
      className="py-16 md:py-24"
    >
      <Container
        className={[
          "grid items-center gap-12 lg:gap-16",
          "lg:grid-cols-2",
        ].join(" ")}
      >
        <MotionSectionItem
          className={[
            "flex flex-col gap-5",
            side === "left" ? "lg:order-2" : "lg:order-1",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            {icon ? (
              <span
                aria-hidden="true"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] text-[var(--color-brand)]"
              >
                {icon}
              </span>
            ) : null}
            <span
              className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {eyebrow}
            </span>
          </div>
          <h2
            id={headingId}
            className="text-3xl font-semibold tracking-tight text-dc-text md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <p className="text-lg leading-relaxed text-dc-text-2">
            {description}
          </p>
          {bullets && bullets.length > 0 ? (
            <ul className="flex flex-col gap-2 text-base text-dc-text-2">
              {bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]"
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </MotionSectionItem>

        <MotionSectionItem
          className={side === "left" ? "lg:order-1" : "lg:order-2"}
        >
          <div
            role="img"
            aria-label={`Mockup: ${mockupLabel}`}
            className="relative flex min-h-[320px] w-full flex-col overflow-hidden rounded-xl border border-dc-edge bg-dc-raised p-6 md:min-h-[360px] md:p-8"
          >
            <span
              aria-hidden="true"
              className="absolute right-4 top-4 rounded border border-dc-edge bg-dc-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-dc-text-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Mockup
            </span>
            {mockup}
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

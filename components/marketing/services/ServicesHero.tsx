// v2.0.0
// Services hero. Blueprint refresh: left-aligned 2-col layout with
// "Engagement Index" framed sidebar panel (S1/S2/S3 with S2 highlighted).

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const ENGAGEMENT_INDEX = [
  { tag: "S1", label: "Operations Consulting", featured: false },
  { tag: "S2", label: "Fractional Leadership", featured: true },
  { tag: "S3", label: "Custom App Solutions", featured: false },
] as const;

function EngagementIndexPanel() {
  return (
    <FramedPanel className="p-5">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Engagement Index
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.1em] rounded-full px-2 py-0.5"
          style={{
            fontFamily: "var(--font-mono)",
            background: "color-mix(in srgb, var(--color-brand) 12%, transparent)",
            color: "var(--color-brand)",
            border: "1px solid color-mix(in srgb, var(--color-brand) 25%, transparent)",
          }}
        >
          3 Paths
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {ENGAGEMENT_INDEX.map(({ tag, label, featured }) => (
          <div
            key={tag}
            className="flex items-center gap-3 rounded-[4px] px-3 py-2.5"
            style={
              featured
                ? {
                    background: "color-mix(in srgb, var(--color-brand) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-brand) 25%, transparent)",
                  }
                : {
                    background: "transparent",
                    border: "1px solid transparent",
                  }
            }
          >
            <span
              className="shrink-0 text-[10px] font-semibold tracking-[0.1em]"
              style={{
                fontFamily: "var(--font-mono)",
                color: featured ? "var(--color-brand)" : "var(--color-dc-text-3)",
              }}
            >
              {tag}
            </span>
            <span
              className="text-sm"
              style={{ color: featured ? "var(--color-dc-text)" : "var(--color-dc-text-2)" }}
            >
              {label}
            </span>
            {featured ? (
              <span
                className="ml-auto text-[10px] font-semibold uppercase tracking-[0.1em] shrink-0"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-brand)",
                }}
              >
                Most requested
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </FramedPanel>
  );
}

export function ServicesHero() {
  return (
    <MotionSection
      aria-label="Services overview"
      variants={staggerContainer}
      className="py-20 md:py-28"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text column */}
          <div className="flex flex-col gap-6">
            <MotionSectionItem>
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 shrink-0"
                  style={{ background: "var(--color-brand)" }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Services
                </span>
              </div>
            </MotionSectionItem>

            <MotionSectionItem>
              <h1
                className="text-dc-text"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "clamp(34px,5vw,62px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                Three ways to work together.
              </h1>
            </MotionSectionItem>

            <MotionSectionItem>
              <p className="text-lg leading-relaxed text-dc-text-2 max-w-lg">
                Every engagement is different. Some operations need a consultant.
                Some need a platform. Some need something built from scratch. The
                first conversation figures out which one fits.
              </p>
            </MotionSectionItem>

            <MotionSectionItem className="flex flex-wrap items-center gap-3">
              <Button
                href="/contact"
                size="lg"
                trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
              >
                Talk to Rob
              </Button>
              <Button href="#services-comparison" variant="secondary" size="lg">
                Compare engagements
              </Button>
            </MotionSectionItem>
          </div>

          {/* Engagement index sidebar */}
          <MotionSectionItem>
            <div className="max-w-sm mx-auto lg:mx-0">
              <EngagementIndexPanel />
            </div>
          </MotionSectionItem>
        </div>
      </Container>
    </MotionSection>
  );
}

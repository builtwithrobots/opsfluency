// v5.0.0
// Consultancy home hero. Blueprint refresh:
// - Left-aligned 2-column layout on lg+; stacks on mobile.
// - Kicker: 8x8px teal square + "CONSULTING · PLATFORM · CUSTOM TOOLS"
// - Secondary CTA changed to "See how I work" linking to /services.
// - Right column: Facility Readout panel (consulting outcomes, not app UI).
// - Compliance badge context line added below badges.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const OUTCOME_ROWS = [
  { label: "Order accuracy", value: "99.2%", delta: "+2.1%", up: true },
  { label: "On-time dispatch", value: "98%", delta: "+6%", up: true },
  { label: "Lost-time incidents", value: "0", delta: null, up: null },
] as const;

const BAR_HEIGHTS = [55, 60, 65, 58, 72, 68, 80, 76, 82, 88, 91, 94] as const;

function FacilityReadout() {
  return (
    <FramedPanel withCornerTicks className="p-5 md:p-6 max-w-sm mx-auto lg:mx-0">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-5">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Facility Readout · 90 Days
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{
            background: "color-mix(in srgb, var(--color-signal-ok) 12%, transparent)",
            color: "var(--color-signal-ok)",
            border: "1px solid color-mix(in srgb, var(--color-signal-ok) 25%, transparent)",
          }}
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-signal-ok)] animate-heartbeat"
          />
          On Track
        </span>
      </div>

      {/* Outcome rows */}
      <div className="flex flex-col gap-3 mb-5">
        {OUTCOME_ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-sm text-dc-text-2">{row.label}</span>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold tabular-nums text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {row.value}
              </span>
              {row.delta ? (
                <span
                  className="text-xs font-medium tabular-nums"
                  style={{ color: "var(--color-signal-ok)" }}
                >
                  {row.delta}
                </span>
              ) : (
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-signal-ok)" }}
                >
                  ✓
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trend bars */}
      <div
        className="mb-1 flex items-end gap-[3px] h-12"
        aria-label="Weekly output trend, 12 weeks"
      >
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              background: i >= 9
                ? "var(--color-brand)"
                : "color-mix(in srgb, var(--color-brand) 25%, transparent)",
            }}
          />
        ))}
      </div>
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Weekly Output · 12 Wks
      </span>

      {/* Floating chips */}
      <div className="mt-5 flex flex-col gap-2">
        <span
          className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold animate-brand-glow"
          style={{
            background: "color-mix(in srgb, var(--color-brand) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-brand) 30%, transparent)",
            color: "var(--color-brand)",
            fontFamily: "var(--font-mono)",
          }}
        >
          17 hrs/week recovered
        </span>
        <span
          className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{
            background: "color-mix(in srgb, var(--color-signal-ok) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-signal-ok) 25%, transparent)",
            color: "var(--color-signal-ok)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-signal-ok)]"
          />
          Runs without me on site
        </span>
      </div>
    </FramedPanel>
  );
}

const COMPLIANCE_BADGES = ["OSHA", "ISO 9001", "cGMP"] as const;

export function HomeHero() {
  return (
    <MotionSection
      aria-label="OpsFluency consultancy hero"
      variants={staggerContainer}
      className="relative overflow-hidden py-20 md:py-32"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text column */}
          <div className="flex flex-col gap-6">
            {/* Kicker */}
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
                  Consulting · Platform · Custom Tools
                </span>
              </div>
            </MotionSectionItem>

            {/* Headline */}
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
                Fix your operation.{" "}
                <span className="relative inline-block">
                  Train your team to{" "}
                  <span style={{ color: "var(--color-brand)" }}>own it</span>.
                </span>{" "}
                Leave it running.
              </h1>
            </MotionSectionItem>

            {/* Subhead */}
            <MotionSectionItem>
              <p className="text-lg leading-relaxed text-dc-text-2 md:text-xl max-w-lg">
                20 years of warehouse and manufacturing leadership, turned into a
                consulting practice built for facilities that need results, not
                reports. OpsFluency is the platform I built because the tools I
                needed did not exist.
              </p>
            </MotionSectionItem>

            {/* CTAs */}
            <MotionSectionItem className="flex flex-wrap items-center gap-3">
              <Button
                href="/contact"
                size="lg"
                trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
              >
                Talk to Rob
              </Button>
              <Button href="/services" variant="secondary" size="lg">
                See how I work
              </Button>
            </MotionSectionItem>

            {/* Compliance badges + context */}
            <MotionSectionItem className="flex flex-col gap-2">
              <div
                aria-label="Compliance experience"
                className="flex flex-wrap items-center gap-2"
              >
                {COMPLIANCE_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[var(--color-brand)]/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-brand)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <p className="text-xs text-dc-text-3">
                Rob has led audits under all three standards with zero non-conformances.
              </p>
            </MotionSectionItem>
          </div>

          {/* Visual column — Facility Readout */}
          <MotionSectionItem>
            <FacilityReadout />
          </MotionSectionItem>
        </div>
      </Container>
    </MotionSection>
  );
}

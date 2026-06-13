// v3.0.0
// Consultancy homepage hero. Editorial authority with industrial precision.
// Pill eyebrow badge, decorative teal rule, large headline with underline
// accent, expanded 4-item trust strip including compliance credentials.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const TRUST_ITEMS = [
  ">20 years of operations experience",
  ">99% order accuracy across multiple facilities",
  "Zero lost-time incidents, every site",
] as const;

const COMPLIANCE_BADGES = ["OSHA", "ISO 9001", "cGMP"] as const;

export function HomeHero() {
  return (
    <MotionSection
      aria-label="OpsFluency consultancy hero"
      variants={staggerContainer}
      className="relative isolate overflow-hidden py-24 md:py-36"
    >
      {/* Atmospheric radial gradient behind the content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--color-brand) 8%, transparent) 0%, transparent 70%)",
        }}
      />

      <Container className="flex flex-col items-center gap-10 text-center">
        {/* Decorative rule + eyebrow pill */}
        <MotionSectionItem className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="block h-px w-10 bg-[var(--color-brand)]"
          />
          <span
            className="inline-flex items-center rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Operations Consulting &amp; Bilingual SOP Platform
          </span>
        </MotionSectionItem>

        {/* Headline */}
        <MotionSectionItem>
          <h1
            className="max-w-4xl text-5xl font-bold tracking-tight text-dc-text md:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your floor is running on{" "}
            <span className="relative inline-block">
              tribal knowledge.
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[var(--color-brand)]/40"
              />
            </span>
          </h1>
        </MotionSectionItem>

        {/* Subhead */}
        <MotionSectionItem>
          <p className="max-w-2xl text-lg leading-relaxed text-dc-text-2 md:text-xl">
            {"I've spent more than 20 years fixing that — in warehouses, manufacturing plants, and 3PLs across the country. OpsFluency is how I do it now."}
          </p>
        </MotionSectionItem>

        {/* CTAs */}
        <MotionSectionItem className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            href="/contact"
            size="lg"
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
          >
            Talk to Rob
          </Button>
          <Button href="https://app.opsfluency.com" variant="secondary" size="lg">
            See the Platform
          </Button>
        </MotionSectionItem>

        {/* Trust strip + compliance badges */}
        <MotionSectionItem className="flex flex-col items-center gap-4 pt-2">
          <ul
            aria-label="Career credentials"
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
          >
            {TRUST_ITEMS.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 text-xs text-dc-text-3"
              >
                <span
                  aria-hidden="true"
                  className="h-1 w-1 shrink-0 rounded-full bg-[var(--color-brand)]"
                />
                {item}
              </li>
            ))}
          </ul>
          <div
            aria-label="Compliance experience"
            className="flex flex-wrap items-center justify-center gap-2"
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
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

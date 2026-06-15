// v2.0.0
// Blueprint refresh: BlueprintSectionHeader numeral "01", FramedPanel
// with corner ticks, teal-tinted pricing callout, sharp corners.

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/marketing/Button";
import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "tools-platform-heading";

const FEATURES = [
  "Bilingual SOPs in English and Spanish, AI-converted from your existing documents",
  "Company glossary that learns your site-specific terminology and persists across every future translation",
  "QR codes tied to locations and equipment, not individual SOPs -- content accumulates without reprinting",
  "Worker PWA with magic-link sign-in, no app store download required",
  "OSHA-compliant comprehension records and scan analytics",
  "Flat rate per facility -- unlimited workers, unlimited SOPs",
] as const;

export function ToolsPlatformCard() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="border-t border-dc-edge bg-dc-raised py-12 md:py-16"
    >
      <Container className="flex flex-col gap-10">
        <BlueprintSectionHeader
          numeral="01"
          kicker="The platform"
          heading="OpsFluency Platform"
          subhead="Bilingual SOP delivery, QR codes mounted at the machines, company glossary that gets smarter with every document, and OSHA-compliant comprehension records. Flat rate per facility, not per seat."
          id={HEADING_ID}
        />

        <FramedPanel withCornerTicks className="flex flex-col gap-6 p-8 md:p-10 max-w-4xl">
          {/* Available now badge */}
          <span
            className="inline-flex items-center gap-2 self-start rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{
              background: "color-mix(in srgb, var(--color-signal-ok) 12%, transparent)",
              color: "var(--color-signal-ok)",
              border: "1px solid color-mix(in srgb, var(--color-signal-ok) 25%, transparent)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 shrink-0 animate-heartbeat rounded-full bg-[var(--color-signal-ok)]"
            />
            Available now
          </span>

          {/* Feature bullets */}
          <ul className="grid gap-3 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="text-sm leading-relaxed text-dc-text-2">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* Pricing callout */}
          <div
            className="rounded-[4px] border border-dc-edge p-5"
            style={{
              background: "color-mix(in srgb, var(--color-brand) 6%, transparent)",
            }}
          >
            <p className="text-base font-semibold text-dc-text">
              Starter from $79 per month. Growth from $119. No per-seat fees.
            </p>
            <Link
              href="/pricing"
              className="mt-1 inline-block text-sm text-[var(--color-brand)] underline underline-offset-2 hover:text-[var(--color-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
            >
              See full pricing
            </Link>
          </div>

          {/* CTA */}
          <div>
            <Button
              href="https://app.opsfluency.com"
              size="lg"
              target="_blank"
              rel="noopener noreferrer"
              trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
            >
              Try it free for 14 days
            </Button>
          </div>
        </FramedPanel>
      </Container>
    </MotionSection>
  );
}

// v1.0.0
// OpsFluency Platform feature card. "Available now" badge, description,
// six feature bullets with Check icons, pricing callout, and a primary
// external CTA.

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

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
      aria-label="OpsFluency Platform"
      variants={staggerContainer}
      className="bg-dc-raised py-16 md:py-24"
    >
      <Container>
        <MotionSectionItem>
          <div className="rounded-2xl border border-dc-edge bg-dc-surface p-8 md:p-12">
            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{
                background:
                  "color-mix(in srgb, var(--color-signal-ok) 12%, transparent)",
                color: "var(--color-signal-ok)",
              }}
            >
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 animate-heartbeat rounded-full bg-[var(--color-signal-ok)]"
              />
              Available now
            </span>

            {/* Title */}
            <h2
              className="mt-6 text-3xl font-bold tracking-tight text-dc-text md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              OpsFluency Platform
            </h2>

            {/* Description */}
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-dc-text-2">
              Bilingual SOP delivery, QR codes mounted at the machines, company
              glossary that gets smarter with every document, and
              OSHA-compliant comprehension records. Flat rate per facility, not
              per seat.
            </p>

            {/* Feature bullets -- 2 col on md+ */}
            <ul className="mt-8 grid gap-3 md:grid-cols-2">
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
            <div className="mt-8 flex flex-col gap-1.5 rounded-lg border border-dc-edge bg-dc-raised p-5">
              <p className="text-base font-semibold text-dc-text">
                Starter from $79 per month. Growth from $119. No per-seat fees.
              </p>
              <Link
                href="/pricing"
                className="text-sm text-[var(--color-brand)] underline underline-offset-2 hover:text-[var(--color-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
              >
                See full pricing
              </Link>
            </div>

            {/* CTA */}
            <div className="mt-8">
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
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

// v1.0.0
// Three-column tier card grid. Fractional Leadership is featured
// (center column) with brand glow border and "Most requested" badge.
// Desktop: three columns. Mobile: single column stack.
// No pricing, no dollar amounts anywhere on this component.

"use client";

import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";

type TierDef = {
  id: string;
  name: string;
  tagline: string;
  featured: boolean;
  engagementModel: string;
  startsWith: string;
  highlights: string[];
  cta: string;
  ctaHref: string;
};

const TIERS: TierDef[] = [
  {
    id: "consulting",
    name: "Operations Consulting",
    tagline: "Fresh eyes on your operation. Findings you can act on.",
    featured: false,
    engagementModel: "Project-based or monthly retainer",
    startsWith: "Starts with a half-day discovery session",
    highlights: [
      "On-site or remote discovery session",
      "Written findings report in 5 business days",
      "SOP development and documentation",
      "Workflow and process redesign",
      "Team alignment and training",
      "Direct access to Rob throughout",
    ],
    cta: "Talk to Rob",
    ctaHref: "/contact",
  },
  {
    id: "fractional",
    name: "Fractional Leadership",
    tagline: "Build the systems. Empower the team. Leave it running.",
    featured: true,
    engagementModel: "Weekly or bi-weekly. Minimum three months.",
    startsWith: "Starts with an operational assessment",
    highlights: [
      "Leadership meeting attendance",
      "Operational decision ownership",
      "Workflow and process system builds",
      "Mid-level manager coaching and empowerment",
      "Accountability structures that persist after engagement ends",
      "No new layers of management added",
      "Direct access to Rob throughout",
    ],
    cta: "Talk to Rob",
    ctaHref: "/contact",
  },
  {
    id: "custom",
    name: "Custom App Solutions",
    tagline: "If the right tool does not exist yet, we build it.",
    featured: false,
    engagementModel: "Scoped per project",
    startsWith: "Starts with a discovery call and proposal",
    highlights: [
      "Workflow and requirements analysis",
      "Purpose-built application development",
      "OpsFluency platform implementation",
      "Compliance-specific tooling",
      "Ongoing support available post-launch",
      "Direct access to Rob throughout",
    ],
    cta: "Talk to Rob",
    ctaHref: "/contact",
  },
];

function TierCard({ tier }: { tier: TierDef }) {
  const cardClasses = [
    "relative flex flex-col gap-5 rounded-2xl border p-7",
    tier.featured
      ? "border-[var(--color-brand)] bg-white dark:bg-dc-raised animate-brand-glow shadow-xl"
      : "border-dc-edge bg-dc-surface",
  ].join(" ");

  return (
    <div className={cardClasses}>
      {tier.featured ? (
        <div aria-hidden="true" className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="inline-block rounded-full bg-[var(--color-brand)] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Most requested
          </span>
        </div>
      ) : null}
      {/* sr-only label so screen readers get the featured status independent of color/badge */}
      {tier.featured ? (
        <span className="sr-only">Most requested engagement type</span>
      ) : null}

      <div className="flex flex-col gap-1">
        <h3
          className="text-sm font-semibold text-dc-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {tier.name}
        </h3>
        <p className="text-base leading-snug text-dc-text-2">{tier.tagline}</p>
      </div>

      <div className="flex flex-col gap-0.5">
        <p
          className="text-xs text-dc-text-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {tier.engagementModel}
        </p>
        <p className="text-xs italic text-dc-text-3">{tier.startsWith}</p>
      </div>

      <hr className="border-dc-edge" />

      <ul className="flex flex-col gap-2.5">
        {tier.highlights.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-dc-text-2">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        <Button
          href={tier.ctaHref}
          variant={tier.featured ? "primary" : "secondary"}
          size="md"
          fullWidth
          trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
        >
          {tier.cta}
        </Button>
      </div>
    </div>
  );
}

export function ServicesTierGrid() {
  return (
    <section aria-label="Service tiers" className="pb-16 pt-4 md:pb-24">
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </Container>
    </section>
  );
}

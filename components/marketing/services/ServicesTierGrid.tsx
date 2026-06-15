// v2.0.0
// Three-column tier card grid. Blueprint refresh: S1/S2/S3 mono tags,
// sharp 4px radius, border-t-3px teal on featured (Fractional).
// "Most requested" badge at top-center. Ghost numeral "01" header.
// Desktop: three columns. Mobile: single column stack.
// No pricing, no dollar amounts anywhere on this component.

"use client";

import { ArrowRight, Check } from "lucide-react";

import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";

type TierDef = {
  id: string;
  tag: string;
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
    tag: "S1",
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
    tag: "S2",
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
    tag: "S3",
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

const HEADING_ID = "services-tier-heading";

function TierCard({ tier }: { tier: TierDef }) {
  return (
    <FramedPanel
      featured={tier.featured}
      className={[
        "relative flex flex-col gap-5 p-7",
        tier.featured ? "translate-y-[-4px]" : "",
      ].join(" ")}
    >
      {tier.featured ? (
        <div aria-hidden="true" className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="inline-block rounded-full bg-[var(--color-brand)] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Most requested
          </span>
        </div>
      ) : null}
      {tier.featured ? (
        <span className="sr-only">Most requested engagement type</span>
      ) : null}

      {/* Mono tag */}
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {tier.tag}
      </span>

      <div className="flex flex-col gap-1">
        <h3
          className="text-base font-semibold text-dc-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {tier.name}
        </h3>
        <p className="text-sm leading-snug text-dc-text-2">{tier.tagline}</p>
      </div>

      <div className="flex flex-col gap-0.5">
        <p
          className="text-[11px] text-dc-text-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {tier.engagementModel}
        </p>
        <p className="text-xs italic text-dc-text-3">{tier.startsWith}</p>
      </div>

      <span
        aria-hidden="true"
        className="block h-px w-full"
        style={{
          background:
            "repeating-linear-gradient(90deg, var(--color-dc-edge) 0 7px, transparent 7px 14px)",
        }}
      />

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
    </FramedPanel>
  );
}

export function ServicesTierGrid() {
  return (
    <section aria-labelledby={HEADING_ID} className="border-t border-dc-edge py-16 md:py-24">
      <Container className="flex flex-col gap-12">
        <BlueprintSectionHeader
          numeral="01"
          kicker="The engagements"
          heading="Pick the level of involvement that fits."
          subhead="Every engagement includes direct access to Rob. No account manager in the middle."
          id={HEADING_ID}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </Container>
    </section>
  );
}

// v1.0.0
// Pricing teaser. Four tier cards with employees and annual monthly
// price, Growth highlighted as "Most popular". Full toggle and feature
// matrix live on /pricing.

import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-pricing-heading";

type Tier = {
  name: string;
  employees: string;
  priceAnnual: string;
  priceMtm: string;
  featured?: boolean;
  note?: string;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    employees: "Up to 50",
    priceAnnual: "$79",
    priceMtm: "$99",
  },
  {
    name: "Growth",
    employees: "51 to 150",
    priceAnnual: "$119",
    priceMtm: "$149",
    featured: true,
    note: "Most popular. Expensable without approval.",
  },
  {
    name: "Scale",
    employees: "151 to 500",
    priceAnnual: "$199",
    priceMtm: "$249",
  },
  {
    name: "Enterprise",
    employees: "500+",
    priceAnnual: "Custom",
    priceMtm: "Custom",
  },
];

export function HomePricingTeaser() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="py-16 md:py-24"
    >
      <Container className="flex flex-col gap-12">
        <MotionSectionItem>
          <SectionHeader
            id={HEADING_ID}
            eyebrow="Pricing"
            heading="Flat rate. No per-user fees."
            subhead="Growth is $119 a month on annual, $149 month-to-month. Your manager can expense that without a committee."
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={[
                  "relative flex flex-col gap-4 rounded-xl border p-6",
                  tier.featured
                    ? "border-[var(--color-brand)] bg-dc-raised animate-brand-glow"
                    : "border-dc-edge bg-dc-surface",
                ].join(" ")}
              >
                {tier.featured ? (
                  <span
                    className="absolute -top-3 right-4 rounded-full bg-[var(--color-brand)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Most popular
                  </span>
                ) : null}
                <div>
                  <h3
                    className="text-lg font-semibold text-dc-text"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-sm text-dc-text-2">{tier.employees} employees</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-4xl font-bold tabular-nums text-dc-text"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {tier.priceAnnual}
                  </span>
                  {tier.priceAnnual !== "Custom" ? (
                    <span className="text-sm text-dc-text-2">/ mo</span>
                  ) : null}
                </div>
                <p className="text-xs text-dc-text-3">
                  {tier.priceAnnual !== "Custom"
                    ? `Billed annually. ${tier.priceMtm} month-to-month.`
                    : "Volume pricing, invoice billing."}
                </p>
                <ul className="mt-2 flex flex-col gap-2 text-sm text-dc-text-2">
                  <li className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>Unlimited bilingual SOPs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>Unlimited QR codes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>Worker PWA and scan analytics</span>
                  </li>
                </ul>
                {tier.note ? (
                  <p className="text-xs font-semibold text-[var(--color-brand)]">
                    {tier.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </MotionSectionItem>
        <MotionSectionItem className="flex justify-center">
          <Button
            href="/pricing"
            variant="secondary"
            size="md"
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
          >
            Compare every feature
          </Button>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

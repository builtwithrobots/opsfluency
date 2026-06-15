// v1.0.0
// Four tier cards. Growth is featured per the pricing override: brand
// glow + "Most popular" ribbon + dc-raised surface. On <768 the row
// becomes a horizontal snap scroller.
//
// Price numerals swap with an AnimatePresence fade when the billing
// toggle changes. No height animation, transform + opacity only.

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/marketing/Button";
import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Container } from "@/components/marketing/Container";
import {
  TIERS,
  priceFor,
  useBilling,
  type Tier,
} from "@/components/marketing/pricing/billing-context";

const FEATURES_BY_TIER: Record<Tier["slug"], string[]> = {
  starter: [
    "Unlimited bilingual SOPs",
    "Unlimited QR codes",
    "Worker PWA with magic-link sign-in",
    "1 monitor included",
    "Email support",
  ],
  growth: [
    "Everything in Starter",
    "Up to 3 monitors",
    "HR module with chat",
    "Scan analytics with CSV export",
    "Priority email support",
  ],
  scale: [
    "Everything in Growth",
    "Up to 10 monitors",
    "Multi-department routing",
    "Onboarding workshop included",
    "Priority response within 4 hours",
  ],
  enterprise: [
    "Everything in Scale",
    "Unlimited monitors",
    "SSO / SAML",
    "Written SLA with credits",
    "Dedicated customer success manager",
  ],
};

function TierCard({ tier }: { tier: Tier }) {
  const { mode } = useBilling();
  const price = priceFor(tier, mode);
  const isCustom = price === "Custom";
  const ctaHref = tier.slug === "enterprise" ? "/contact" : "/sign-up";
  const ctaLabel = tier.slug === "enterprise" ? "Talk to sales" : "Start free trial";

  const cardClasses = [
    "relative flex h-full min-w-[280px] flex-col gap-5 rounded-[4px] border p-6 md:p-7 snap-center",
    tier.featured
      ? "border-[var(--color-brand)] bg-dc-raised animate-brand-glow"
      : "border-dc-edge bg-dc-surface",
  ].join(" ");

  return (
    <div className={cardClasses}>
      {tier.featured ? (
        <span
          className="absolute -top-3 right-6 rounded-full bg-[var(--color-brand)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Most popular
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <h3
          className="text-lg font-semibold text-dc-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {tier.name}
        </h3>
        <p className="text-sm text-dc-text-2">{tier.employees} employees</p>
      </div>
      <div className="flex min-h-[60px] items-baseline gap-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${tier.slug}-${mode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl font-bold tabular-nums tracking-tight text-dc-text"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {price}
          </motion.span>
        </AnimatePresence>
        {!isCustom ? (
          <span className="text-sm text-dc-text-2">/ month</span>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-dc-text-2">{tier.tagline}</p>
      <ul className="flex flex-col gap-2 text-sm text-dc-text-2">
        {FEATURES_BY_TIER[tier.slug].map((feature: string) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-2">
        <CTA href={ctaHref}>{ctaLabel}</CTA>
      </div>
    </div>
  );
}

function CTA({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      href={href}
      size="md"
      fullWidth
      trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
    >
      {children}
    </Button>
  );
}

const TIER_HEADING_ID = "pricing-tiers-heading";

export function PricingTierGrid() {
  return (
    <section aria-labelledby={TIER_HEADING_ID} className="py-10 md:py-16">
      <Container className="flex flex-col gap-8">
        <BlueprintSectionHeader
          numeral="02"
          kicker="The platform"
          heading="Choose a tier."
          id={TIER_HEADING_ID}
        />
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-4 lg:gap-6">
          {TIERS.map((tier) => (
            <TierCard key={tier.slug} tier={tier} />
          ))}
        </div>
      </Container>
    </section>
  );
}

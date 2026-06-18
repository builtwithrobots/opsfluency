// v1.0.0
// Full feature comparison. Desktop (lg+): grid with sticky header row
// showing tier columns and pricing that updates with the billing toggle.
// Mobile: per-tier cards with the same information stacked, since
// horizontal scrolling a feature matrix on a phone is painful.

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Container } from "@/components/marketing/Container";
import {
  TIERS,
  priceFor,
  useBilling,
  type Tier,
} from "@/components/marketing/pricing/billing-context";

type Cell = boolean | string;

type Row = {
  label: string;
  values: Record<Tier["slug"], Cell>;
};

type RowGroup = {
  heading: string;
  rows: Row[];
};

const GROUPS: RowGroup[] = [
  {
    heading: "Content and translation",
    rows: [
      { label: "Bilingual SOPs (English + Spanish)", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "AI conversion (PDF, DOCX, TXT)", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "Company glossary", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "Manager review before publish", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "Additional languages (Phase 2)", values: { starter: false, growth: false, scale: true, enterprise: true } },
    ],
  },
  {
    heading: "Frontline tools",
    rows: [
      { label: "QR-triggered learning", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "Worker PWA (magic link)", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "Offline SOP cache", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "HR module with chat", values: { starter: false, growth: true, scale: true, enterprise: true } },
    ],
  },
  {
    heading: "Displays and communication",
    rows: [
      { label: "Monitor displays", values: { starter: "1", growth: "Up to 3", scale: "Up to 10", enterprise: "Unlimited" } },
      { label: "Announcements", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "Department routing", values: { starter: false, growth: true, scale: true, enterprise: true } },
    ],
  },
  {
    heading: "Analytics and admin",
    rows: [
      { label: "Scan analytics", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "CSV export", values: { starter: false, growth: true, scale: true, enterprise: true } },
      { label: "Role-based access", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "SSO / SAML", values: { starter: false, growth: false, scale: false, enterprise: true } },
    ],
  },
  {
    heading: "Support",
    rows: [
      { label: "Email support", values: { starter: true, growth: true, scale: true, enterprise: true } },
      { label: "Priority response", values: { starter: false, growth: true, scale: true, enterprise: true } },
      { label: "Onboarding workshop", values: { starter: false, growth: false, scale: true, enterprise: true } },
      { label: "Written SLA with credits", values: { starter: false, growth: false, scale: false, enterprise: true } },
      { label: "Dedicated CSM", values: { starter: false, growth: false, scale: false, enterprise: true } },
    ],
  },
];

const HEADING_ID = "pricing-comparison-heading";

function CellIcon({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <Check
        className="mx-auto h-4 w-4 text-[var(--color-brand)]"
        strokeWidth={2}
        aria-label="Included"
      />
    );
  }
  if (value === false) {
    return (
      <Minus
        className="mx-auto h-4 w-4 text-dc-text-3"
        strokeWidth={2}
        aria-label="Not included"
      />
    );
  }
  return <span className="text-sm text-dc-text">{value}</span>;
}

function PriceCell({ tier }: { tier: Tier }) {
  const { mode } = useBilling();
  const price = priceFor(tier, mode);
  const isCustom = price === "Custom";
  return (
    <div className="flex items-baseline justify-center gap-1 overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${tier.slug}-${mode}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl font-bold tabular-nums text-dc-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {price}
        </motion.span>
      </AnimatePresence>
      {!isCustom ? (
        <span className="text-xs text-dc-text-2">/ mo</span>
      ) : null}
    </div>
  );
}

function DesktopTable() {
  return (
    <div className="hidden lg:block">
      <div className="grid grid-cols-[minmax(240px,1.4fr)_repeat(4,minmax(0,1fr))] items-center gap-x-2 rounded-[4px] border border-dc-edge bg-dc-surface">
        <div className="sticky top-16 z-10 col-span-full grid grid-cols-subgrid border-b border-dc-edge-2 bg-dc-overlay px-4 py-4">
          <span
            className="text-xs font-semibold uppercase tracking-widest text-dc-text-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Features
          </span>
          {TIERS.map((tier) => (
            <div key={tier.slug} className="flex flex-col items-center gap-1 text-center">
              <span
                className="text-sm font-semibold text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {tier.name}
              </span>
              <PriceCell tier={tier} />
            </div>
          ))}
        </div>
        {GROUPS.map((group) => (
          <div key={group.heading} className="col-span-full grid grid-cols-subgrid">
            <div className="col-span-full grid grid-cols-subgrid border-b border-dc-edge bg-dc-raised px-4 py-2">
              <span
                className="col-span-full text-xs font-semibold uppercase tracking-widest text-dc-text-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {group.heading}
              </span>
            </div>
            {group.rows.map((row) => (
              <div
                key={row.label}
                className="col-span-full grid grid-cols-subgrid items-center border-b border-dc-edge px-4 py-3 last:border-b-0"
              >
                <span className="text-sm text-dc-text">{row.label}</span>
                {TIERS.map((tier) => (
                  <div key={tier.slug} className="text-center">
                    <CellIcon value={row.values[tier.slug]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileCell({ label, value }: { label: string; value: Cell }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dc-edge py-2 last:border-b-0">
      <span className="text-sm text-dc-text-2">{label}</span>
      <span className="shrink-0">
        <CellIcon value={value} />
      </span>
    </div>
  );
}

function MobileCard({ tier }: { tier: Tier }): ReactNode {
  return (
    <div
      className={[
        "flex flex-col gap-3 rounded-[4px] border p-5",
        tier.featured
          ? "border-[var(--color-brand)] bg-dc-raised"
          : "border-dc-edge bg-dc-surface",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className="text-lg font-semibold text-dc-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {tier.name}
        </h3>
        <PriceCell tier={tier} />
      </div>
      <p className="text-xs text-dc-text-2">{tier.employees} employees</p>
      {GROUPS.map((group) => (
        <div key={group.heading} className="mt-2 flex flex-col gap-1">
          <span
            className="text-[11px] font-semibold uppercase tracking-widest text-dc-text-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {group.heading}
          </span>
          <div className="flex flex-col">
            {group.rows.map((row) => (
              <MobileCell
                key={row.label}
                label={row.label}
                value={row.values[tier.slug]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileCards() {
  return (
    <div className="flex flex-col gap-5 lg:hidden">
      {TIERS.map((tier) => (
        <MobileCard key={tier.slug} tier={tier} />
      ))}
    </div>
  );
}

export function PricingComparison() {
  return (
    <section aria-labelledby={HEADING_ID} className="border-t border-dc-edge py-12 md:py-16">
      <Container className="flex flex-col gap-10">
        <BlueprintSectionHeader
          numeral="03"
          kicker="Compare tiers"
          heading="Every feature, side by side."
          subhead="The full matrix. If it is on this page, it is on your plan at the tier that says so."
          id={HEADING_ID}
        />
        <DesktopTable />
        <MobileCards />
      </Container>
    </section>
  );
}

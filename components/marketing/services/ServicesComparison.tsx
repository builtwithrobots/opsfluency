// v2.0.0
// Feature comparison table. Blueprint refresh: ghost numeral "02",
// section border-top, Fractional column tinted rgba(20,184,166,0.05).
// Desktop (lg+): proper <table> with thead/tbody, scope attributes on
// every th, brand top border on the featured (fractional) column.
// Mobile (<lg): @headlessui/react Tab group -- one tier at a time,
// tabs use role="tablist"/role="tab" with aria-selected + aria-controls.
// true  → Check + sr-only "Included"
// false → X + sr-only "Not included"
// string → the string itself (brand color in fractional column)

"use client";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Check, X } from "lucide-react";

import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Container } from "@/components/marketing/Container";

type Cell = boolean | string;

type Feature = {
  name: string;
  tiers: {
    consulting: Cell;
    fractional: Cell;
    custom: Cell;
  };
};

type Section = {
  name: string;
  features: Feature[];
};

const TIERS_META = [
  { id: "consulting", label: "Consulting" },
  { id: "fractional", label: "Fractional" },
  { id: "custom", label: "Custom" },
] as const;

type TierId = (typeof TIERS_META)[number]["id"];

const COMPARISON_SECTIONS: Section[] = [
  {
    name: "Assessment and Discovery",
    features: [
      {
        name: "On-site assessment",
        tiers: { consulting: true, fractional: true, custom: "As needed" },
      },
      {
        name: "Written findings report",
        tiers: { consulting: true, fractional: true, custom: false },
      },
      {
        name: "Workflow mapping",
        tiers: { consulting: true, fractional: true, custom: true },
      },
    ],
  },
  {
    name: "Delivery",
    features: [
      {
        name: "SOP development and documentation",
        tiers: { consulting: true, fractional: true, custom: false },
      },
      {
        name: "Workflow and process design",
        tiers: { consulting: true, fractional: true, custom: false },
      },
      {
        name: "Custom application development",
        tiers: { consulting: false, fractional: false, custom: true },
      },
      {
        name: "OpsFluency platform implementation",
        tiers: { consulting: "Optional", fractional: "Optional", custom: "Optional" },
      },
    ],
  },
  {
    name: "Team and Leadership",
    features: [
      {
        name: "Team training and empowerment",
        tiers: { consulting: true, fractional: true, custom: false },
      },
      {
        name: "Mid-level manager coaching",
        tiers: { consulting: false, fractional: true, custom: false },
      },
      {
        name: "Leadership meeting attendance",
        tiers: { consulting: false, fractional: true, custom: false },
      },
      {
        name: "Accountability systems that persist after engagement",
        tiers: { consulting: "Project scope", fractional: true, custom: false },
      },
    ],
  },
  {
    name: "Access and Support",
    features: [
      {
        name: "Direct access to Rob",
        tiers: { consulting: true, fractional: true, custom: true },
      },
      {
        name: "Ongoing support after engagement ends",
        tiers: { consulting: "Optional", fractional: "Optional", custom: "Optional" },
      },
    ],
  },
];

function CellValue({ value, featured }: { value: Cell; featured?: boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check
          className="h-5 w-5 text-[var(--color-brand)]"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <X
          className="h-5 w-5 text-dc-text-3"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return (
    <span
      className={[
        "text-sm",
        featured ? "text-[var(--color-brand)]" : "text-dc-text",
      ].join(" ")}
    >
      {value}
    </span>
  );
}

// ── Desktop ──────────────────────────────────────────────────────────────────

function DesktopTable() {
  return (
    <div className="hidden lg:block">
      <table className="w-full border-collapse rounded-xl border border-dc-edge bg-dc-surface text-left">
        <thead>
          <tr className="border-b border-dc-edge bg-dc-overlay">
            <th
              scope="col"
              className="w-[40%] px-5 py-4 text-xs font-semibold uppercase tracking-widest text-dc-text-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Features
            </th>
            {TIERS_META.map((tier) => (
              <th
                key={tier.id}
                scope="col"
                className={[
                  "px-5 py-4 text-center text-sm font-semibold text-dc-text",
                  tier.id === "fractional"
                    ? "border-t-2 border-t-[var(--color-brand)]"
                    : "",
                ].join(" ")}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {tier.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_SECTIONS.map((section) => (
            <>
              <tr
                key={section.name}
                className="border-b border-dc-edge bg-dc-raised"
              >
                <th
                  scope="row"
                  colSpan={4}
                  className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-dc-text-3"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {section.name}
                </th>
              </tr>
              {section.features.map((feature, idx) => (
                <tr
                  key={feature.name}
                  className={[
                    "border-b border-dc-edge",
                    idx === section.features.length - 1 ? "last:border-b-0" : "",
                  ].join(" ")}
                >
                  <th
                    scope="row"
                    className="px-5 py-3.5 text-sm font-normal text-dc-text"
                  >
                    {feature.name}
                  </th>
                  {TIERS_META.map((tier) => (
                    <td
                      key={tier.id}
                      className="px-5 py-3.5 text-center"
                      style={
                        tier.id === "fractional"
                          ? { background: "rgba(20,184,166,0.05)" }
                          : undefined
                      }
                    >
                      <CellValue
                        value={feature.tiers[tier.id]}
                        featured={tier.id === "fractional"}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobilePanel({ tierId }: { tierId: TierId }) {
  return (
    <div className="flex flex-col gap-6">
      {COMPARISON_SECTIONS.map((section) => (
        <div key={section.name}>
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-dc-text-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {section.name}
          </p>
          <div
            className={[
              "flex flex-col rounded-xl border",
              tierId === "fractional"
                ? "border-[var(--color-brand)] bg-dc-raised"
                : "border-dc-edge bg-dc-surface",
            ].join(" ")}
          >
            {section.features.map((feature, idx) => (
              <div
                key={feature.name}
                className={[
                  "flex items-center justify-between gap-3 px-4 py-3",
                  idx < section.features.length - 1 ? "border-b border-dc-edge" : "",
                ].join(" ")}
              >
                <span className="text-sm text-dc-text-2">{feature.name}</span>
                <span className="shrink-0">
                  <CellValue
                    value={feature.tiers[tierId]}
                    featured={tierId === "fractional"}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileTabs() {
  return (
    <div className="lg:hidden">
      <TabGroup>
        <TabList className="mb-6 flex rounded-xl border border-dc-edge bg-dc-surface p-1">
          {TIERS_META.map((tier) => (
            <Tab
              key={tier.id}
              className={({ selected }: { selected: boolean }) =>
                [
                  "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-1",
                  selected
                    ? "bg-[var(--color-brand)] text-white shadow-sm"
                    : "text-dc-text-2 hover:text-dc-text",
                ].join(" ")
              }
              style={{ fontFamily: "var(--font-display)", minHeight: "44px" }}
            >
              {tier.label}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {TIERS_META.map((tier) => (
            <TabPanel key={tier.id}>
              <MobilePanel tierId={tier.id} />
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

const HEADING_ID = "services-comparison-heading";

export function ServicesComparison() {
  return (
    <section
      id="services-comparison"
      aria-labelledby={HEADING_ID}
      className="border-t border-dc-edge py-16 md:py-24"
    >
      <Container className="flex flex-col gap-12">
        <BlueprintSectionHeader
          numeral="02"
          kicker="Compare engagements"
          heading="What is included in each."
          subhead="Every engagement is direct access to Rob. The difference is scope, depth, and what you need on the other side."
          id={HEADING_ID}
        />
        <DesktopTable />
        <MobileTabs />
      </Container>
    </section>
  );
}

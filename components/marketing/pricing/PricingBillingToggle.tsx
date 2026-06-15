// v1.0.0
// Annual / month-to-month toggle. Single Framer Motion layoutId on a
// sliding pill highlights the active choice without re-mounting.
// Keyboard accessible: focus moves to the active button, Tab / Shift+Tab
// between the two. Space or Enter to activate.

"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/marketing/Container";
import {
  useBilling,
  type BillingMode,
} from "@/components/marketing/pricing/billing-context";

type ToggleOption = { value: BillingMode; label: string; note: string };

const OPTIONS: ToggleOption[] = [
  { value: "annual", label: "Annual", note: "Save 20 percent" },
  { value: "monthly", label: "Month-to-month", note: "No commitment" },
];

export function PricingBillingToggle() {
  const { mode, setMode } = useBilling();

  return (
    <section aria-label="Billing cadence" className="border-t border-dc-edge py-8 md:py-10">
      <Container className="flex flex-col items-center gap-3">
        <div
          role="radiogroup"
          aria-label="Billing cadence"
          className="inline-flex items-center rounded-full border border-dc-edge bg-dc-surface p-1"
        >
          {OPTIONS.map((option) => {
            const active = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(option.value)}
                className={[
                  "relative inline-flex h-10 min-w-[140px] items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors",
                  active
                    ? "text-white"
                    : "text-dc-text-2 hover:text-dc-text",
                ].join(" ")}
              >
                {active ? (
                  <motion.span
                    layoutId="billing-toggle-pill"
                    className="absolute inset-0 rounded-full bg-[var(--color-brand)]"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 32,
                    }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-10">{option.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-dc-text-3">
          {mode === "annual"
            ? "Annual billing. Month-to-month is about 20 percent more."
            : "Billed monthly. Switch to annual any time for a lower rate."}
        </p>
      </Container>
    </section>
  );
}

// v2.0.0
// Blueprint refresh: FramedPanel with corner ticks, teal-tinted border,
// section border-top. Answers "can I expense this?" inline.

import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "pricing-expense-heading";

export function PricingExpenseCallout() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="border-t border-dc-edge py-12 md:py-16"
    >
      <Container>
        <FramedPanel
          withCornerTicks
          className="max-w-3xl border-[var(--color-brand)] p-6 md:p-8"
          style={{ background: "color-mix(in srgb, var(--color-brand) 5%, transparent)" }}
        >
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0"
              style={{ background: "var(--color-brand)" }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Deliberately priced
            </span>
          </div>
          <h2
            id={HEADING_ID}
            className="mt-4 text-2xl font-semibold tracking-tight text-dc-text md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Can I expense this without asking my boss?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-dc-text-2 md:text-lg">
            At most companies: yes. Growth at $119 on annual (or $149
            month-to-month) sits under the common $150 per-month expense
            approval threshold, and under the $2,500 annual single-approver
            line. That is on purpose. Frontline managers should not need a
            procurement committee to fix frontline problems.
          </p>
        </FramedPanel>
      </Container>
    </MotionSection>
  );
}

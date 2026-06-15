// v1.0.0
// Credibility metrics strip. Four headline stats immediately below the
// hero. Each metric has a subtle left accent in brand color. Static --
// the numbers do the work.

import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

type Metric = {
  value: string;
  label: string;
};

const METRICS: Metric[] = [
  { value: "20+", label: "Years on the floor" },
  { value: "99%+", label: "Accuracy and on-time delivery, every site" },
  { value: "6", label: "Facility start-ups and scale events" },
  { value: "Zero", label: "Lost-time incidents across every site managed" },
];

export function HomeCredibilityStrip() {
  return (
    <MotionSection
      aria-label="Career credentials"
      variants={staggerContainer}
      className="bg-dc-raised"
    >
      <Container>
        <dl className="grid grid-cols-2 divide-x divide-dc-edge border-y border-dc-edge lg:grid-cols-4">
          {METRICS.map((metric) => (
            <MotionSectionItem
              key={metric.label}
              className="px-6 py-10 first:pl-0 last:pr-0"
            >
              <div
                className="flex flex-col gap-2 border-l-2 pl-4"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--color-brand) 30%, transparent)",
                }}
              >
                <dt
                  className="text-3xl font-bold tracking-tight text-dc-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {metric.value}
                </dt>
                <dd className="text-sm leading-snug text-dc-text-2">
                  {metric.label}
                </dd>
              </div>
            </MotionSectionItem>
          ))}
        </dl>
      </Container>
    </MotionSection>
  );
}

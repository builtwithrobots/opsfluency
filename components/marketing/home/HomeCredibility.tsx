// v2.0.0
// Credibility section. Rob's bio, 4-stat grid, compliance credential pills,
// and award line. Two-column layout on desktop: photo on the right.

import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-credibility-heading";

type Stat = { value: string; label: string };

const STATS: Stat[] = [
  { value: ">20 yrs", label: "Operations experience" },
  { value: "4", label: "Cold-start facility builds" },
  { value: ">99%", label: "Order accuracy" },
  { value: "0", label: "Lost-time incidents" },
];

const COMPLIANCE_BADGES = ["OSHA Compliant", "ISO 9001", "cGMP", "Zero non-conformances"] as const;

export function HomeCredibility() {
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
            heading=">20 years. Four operations built from scratch. Zero lost-time incidents."
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Bio + stats + compliance */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4 text-base leading-relaxed text-dc-text-2">
                <p>
                  {"I'm Rob Ramos. I started on the floor and worked my way to Director of Operations across three sites simultaneously — Nevada, Oklahoma, and Pennsylvania. I've launched facilities from lease signing to first product in market in under 120 days. I've sustained >99% order accuracy. I've led ISO 9001 and cGMP audits with zero non-conformances."}
                </p>
                <p>
                  {"I went back to the floor by choice. Not because I couldn't get a Director role — because that's where the real problems are. When I was managing a team where 60% of the workers spoke Spanish and every SOP was in English, the tools I needed didn't exist. I built them. That's OpsFluency."}
                </p>
              </div>

              {/* 4-stat grid */}
              <dl
                aria-label="Career metrics"
                className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-dc-edge bg-dc-edge sm:grid-cols-4"
              >
                {STATS.map((stat) => (
                  <div
                    key={stat.value}
                    className="flex flex-col gap-1 bg-dc-surface px-4 py-5"
                  >
                    <dt className="text-xs text-dc-text-3">{stat.label}</dt>
                    <dd
                      className="text-2xl font-bold tracking-tight text-dc-text"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Compliance credential pills */}
              <div className="flex flex-wrap gap-2">
                {COMPLIANCE_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[var(--color-brand)]/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-brand)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <p className="text-xs text-dc-text-3">
                Outstanding Contributor Award, 2016 — presented by CEO
              </p>
            </div>

            {/* Photo placeholder */}
            <div
              aria-hidden="true"
              className="relative flex aspect-[4/5] w-full max-w-sm items-center justify-center rounded-lg border border-dc-edge bg-dc-raised lg:mx-auto"
            >
              <span className="text-sm text-dc-text-3">Photo coming</span>
            </div>
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

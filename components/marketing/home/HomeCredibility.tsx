// v1.0.0
// Credibility section. Rob's bio in two paragraphs, metrics strip,
// photo placeholder, and award line. Two-column layout on desktop:
// photo on the right, bio + metrics on the left.

import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-credibility-heading";

const METRICS = [
  "22 years of operations",
  "4 cold-start builds",
  ">99% order accuracy",
  "3 states, 1 Director role",
] as const;

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
            heading="22 years. Four operations built from scratch. Zero lost-time incidents."
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Bio + metrics */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 text-base leading-relaxed text-dc-text-2">
                <p>
                  {"I'm Rob Ramos. I started on the floor and worked my way to Director of Operations across three sites simultaneously — Nevada, Oklahoma, and Pennsylvania. I've launched facilities from lease signing to first product in market in under 120 days. I've sustained >99% order accuracy. I've led ISO 9001 and cGMP audits with zero non-conformances."}
                </p>
                <p>
                  {"I went back to the floor by choice. Not because I couldn't get a Director role — because that's where the real problems are. When I was managing a team where 60% of the workers spoke Spanish and every SOP was in English, the tools I needed didn't exist. I built them. That's OpsFluency."}
                </p>
              </div>
              <div
                aria-label="Career metrics"
                className="flex flex-wrap gap-x-4 gap-y-1 border-t border-dc-edge pt-4 text-xs text-dc-text-3"
              >
                {METRICS.map((metric, i) => (
                  <span key={metric} className="inline-flex items-center gap-4">
                    {i > 0 && (
                      <span aria-hidden="true" className="text-dc-edge-2">
                        ·
                      </span>
                    )}
                    {metric}
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

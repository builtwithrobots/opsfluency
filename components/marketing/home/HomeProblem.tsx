// v1.0.0
// Problem section. Three stat callouts in a row with the first
// ("17 hrs/week") emphasized via .animate-brand-glow per the home
// override. Summary paragraph below.

import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { StatCallout } from "@/components/marketing/StatCallout";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-problem-heading";

export function HomeProblem() {
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
            eyebrow="The real problem"
            heading="Workers don't quit for fifty cents more per hour."
            subhead="They quit because they are frustrated and embarrassed. Nod-through training is the root cause, and the numbers below are what it costs you every single week."
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid gap-10 md:grid-cols-3">
            <StatCallout
              emphasis
              value="17 hrs"
              label="Per supervisor, per week"
              caption="Spent re-explaining procedures to workers who nodded through training."
            />
            <StatCallout
              value="Week 8"
              label="When most workers quit"
              caption="By the two-month mark, the worker has given up. Everyone blames pay."
            />
            <StatCallout
              value="0%"
              label="Confidence on Day 1"
              caption="English-only onboarding leaves non-English speakers guessing from the start."
            />
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

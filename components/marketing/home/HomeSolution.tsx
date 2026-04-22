// v1.0.0
// Solution section. Three-pillar FeatureCard grid, each card linking
// to /features.

import { Languages, MessageSquare, QrCode } from "lucide-react";

import { Container } from "@/components/marketing/Container";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-solution-heading";

export function HomeSolution() {
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
            eyebrow="The solution"
            heading="Three things nobody else offers together."
            subhead="Not a translation tool. Operations infrastructure for multilingual teams."
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              href="/features"
              icon={<Languages className="h-6 w-6" strokeWidth={2} />}
              title="Bilingual SOPs"
              description="Upload once. AI converts, flags site-specific terms, and publishes in English and Spanish. Workers read in their language. You never touch it twice."
            />
            <FeatureCard
              href="/features"
              icon={<QrCode className="h-6 w-6" strokeWidth={2} />}
              title="QR-triggered learning"
              description="Print one permanent QR per procedure and mount it on the equipment. Workers scan, read, and get back to work. No passwords, no friction."
            />
            <FeatureCard
              href="/features"
              icon={<MessageSquare className="h-6 w-6" strokeWidth={2} />}
              title="Departmental communication"
              description="Announcements, TV monitors, and HR chat in one place. Managers broadcast without IT tickets. Workers reach HR without leaving the floor."
            />
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

// v1.0.0
// Tools section. OpsFluency Platform card (Tool #1) plus a placeholder
// card for future tools. Platform CTA links to app.opsfluency.com.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-tools-heading";

export function HomeTools() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="py-16 md:py-24 bg-dc-raised"
    >
      <Container className="flex flex-col gap-12">
        <MotionSectionItem>
          <SectionHeader
            id={HEADING_ID}
            heading="The tools I use with every client"
            subhead="Built because they didn't exist. Used in every engagement."
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tool 1: OpsFluency Platform */}
            <div className="flex flex-col gap-4 rounded-lg border border-[var(--color-brand)]/30 bg-dc-surface p-6">
              <h3
                className="text-lg font-bold tracking-tight text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                OpsFluency Platform
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-dc-text-2">
                Bilingual SOP delivery, QR codes mounted at the machines, company glossary that gets smarter with every document, and OSHA-compliant comprehension records. Flat rate per facility — not per seat.
              </p>
              <Button
                href="https://app.opsfluency.com"
                variant="secondary"
                size="sm"
                trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
              >
                Try it free for 14 days
              </Button>
            </div>
            {/* Tool 2: Placeholder */}
            <div className="flex flex-col gap-4 rounded-lg border border-dc-edge bg-dc-surface p-6">
              <h3
                className="text-lg font-bold tracking-tight text-dc-text-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                More tools coming.
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-dc-text-3">
                Every operational problem I work on becomes a candidate for the next tool. If you have a specific workflow problem, let&apos;s talk about whether a custom build makes sense.
              </p>
            </div>
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

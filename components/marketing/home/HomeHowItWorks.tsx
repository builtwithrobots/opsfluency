// v1.0.0
// How It Works preview. Three numbered steps in oversized Chakra Petch,
// then a CTA to /how-it-works for the full walkthrough.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-hiw-heading";

type Step = { number: string; title: string; body: string };

const STEPS: Step[] = [
  {
    number: "01",
    title: "Upload",
    body: "Drop in the PDF or Word doc you already have. No template required. We handle any format managers use in the real world.",
  },
  {
    number: "02",
    title: "AI converts",
    body: "Claude Sonnet rewrites it as clean Markdown and flags site-specific terms. You define the flagged terms once; the glossary remembers them forever.",
  },
  {
    number: "03",
    title: "Worker scans",
    body: "Print the QR and mount it where the work happens. The worker taps, reads it in their language, and gets on with the job.",
  },
];

export function HomeHowItWorks() {
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
            eyebrow="How it works"
            heading="From upload to mounted QR in under 15 minutes."
            subhead="No implementation calls. No consultants. No six-month rollouts."
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <ol className="grid gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.number} className="flex flex-col gap-4">
                <span
                  aria-hidden="true"
                  className="text-6xl font-bold text-[var(--color-brand)] opacity-40 md:text-7xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.number}
                </span>
                <h3
                  className="text-xl font-semibold text-dc-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-dc-text-2">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </MotionSectionItem>
        <MotionSectionItem className="flex justify-center">
          <Button
            href="/how-it-works"
            variant="secondary"
            size="md"
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
          >
            See the full walkthrough
          </Button>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

// v4.0.0
// Problem section. Blueprint refresh: section border-top, ghost numeral
// "01", FramedPanel cards with sharp corners.

import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-problem-heading";

type PainPoint = {
  quote: string;
  response: string;
};

const PAIN_POINTS: PainPoint[] = [
  {
    quote:
      "My Spanish-speaking workers keep making the same mistakes. I don't think they're reading the instructions.",
    response: "They're not. The instructions are in English.",
  },
  {
    quote: "I've rewritten this SOP three times. Nobody uses it.",
    response:
      "That's a delivery problem, not a content problem. The SOP needs to reach the worker at the machine, in their language, without a supervisor standing there.",
  },
  {
    quote:
      "We had an OSHA near-miss. I need proof workers are reading the safety procedures -- not just attending the training.",
    response:
      "A sign-in sheet is not proof of comprehension. I can show you what is.",
  },
  {
    quote: "Turnover in the first 60 days is killing us and I don't know why.",
    response:
      "Workers don't quit for fifty cents more per hour. They quit because they feel incompetent. That's fixable.",
  },
];

function PainCard({ quote, response }: PainPoint) {
  return (
    <FramedPanel hoverable className="flex flex-col gap-4 overflow-hidden p-6 pt-8">
      {/* Decorative large quotation mark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-2 select-none font-serif text-6xl leading-none text-[var(--color-brand)]/15"
      >
        &ldquo;
      </span>
      <blockquote className="border-l-2 border-[var(--color-brand)] pl-4 text-base italic leading-relaxed text-dc-text-2">
        {`"${quote}"`}
      </blockquote>
      {/* 1px dashed divider */}
      <span
        aria-hidden="true"
        className="block h-px w-full"
        style={{
          background:
            "repeating-linear-gradient(90deg, var(--color-dc-edge-2) 0 7px, transparent 7px 14px)",
        }}
      />
      <p className="text-sm font-semibold leading-relaxed text-dc-text">
        {response}
      </p>
    </FramedPanel>
  );
}

export function HomeProblem() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="border-t border-dc-edge py-16 md:py-24"
    >
      <Container className="flex flex-col gap-12">
        <MotionSectionItem>
          <BlueprintSectionHeader
            numeral="01"
            kicker="What I hear from every new client"
            heading="The problems are always the same."
            id={HEADING_ID}
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid gap-5 md:grid-cols-2">
            {PAIN_POINTS.map((point) => (
              <PainCard key={point.quote} {...point} />
            ))}
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

// v3.0.0
// Problem section. Four pain-point quote blocks with decorative large
// quotation marks. Two columns on desktop, single column on mobile.

import { Container } from "@/components/marketing/Container";
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
      "We had an OSHA near-miss. I need proof workers are reading the safety procedures — not just attending the training.",
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
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-lg border border-dc-edge bg-dc-surface p-6 pt-8">
      {/* Decorative large quotation mark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-2 select-none font-serif text-6xl leading-none text-[var(--color-brand)]/15"
      >
        &ldquo;
      </span>
      <blockquote className="border-l-[3px] border-[var(--color-brand)] pl-4 text-base italic leading-relaxed text-dc-text-2">
        {`"${quote}"`}
      </blockquote>
      <p className="text-sm font-semibold leading-relaxed text-dc-text">
        {response}
      </p>
    </div>
  );
}

export function HomeProblem() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="py-16 md:py-24 bg-dc-raised"
    >
      <Container className="flex flex-col gap-12">
        <MotionSectionItem>
          <span
            id={HEADING_ID}
            className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What I hear from every new client
          </span>
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid gap-6 md:grid-cols-2">
            {PAIN_POINTS.map((point) => (
              <PainCard key={point.quote} {...point} />
            ))}
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

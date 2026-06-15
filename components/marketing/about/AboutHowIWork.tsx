// v1.0.0
// How I Work section. Replaces AboutRoadmap on the about page.
// Three numbered steps: first conversation, discovery, the work.
// Prose container, consistent with AboutMission step style.

import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "about-how-i-work-heading";

type Step = {
  number: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    title: "The first conversation",
    body: "We talk about your operation. What is working, what is not, and where the real pain is. This call is free and takes about thirty minutes. I will tell you honestly if I can help and what I think the right engagement looks like.",
  },
  {
    number: "02",
    title: "The discovery",
    body: "For consulting and fractional engagements, I do a half-day on-site or remote discovery session. I look at your workflows, talk to your team, and identify the gaps. You get a written findings report within five business days -- specific, actionable, and yours to keep regardless of whether we work together.",
  },
  {
    number: "03",
    title: "The work",
    body: "We agree on scope, timeline, and what success looks like. Then we get to work. I am on-site when it matters and remote the rest of the time. You always have direct access to me -- not a project coordinator, not an account manager.",
  },
];

export function AboutHowIWork() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="py-12 md:py-16"
    >
      <Container width="prose" className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span
            className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How I work
          </span>
          <h2
            id={HEADING_ID}
            className="text-3xl font-semibold tracking-tight text-dc-text md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What an engagement actually looks like.
          </h2>
          <p className="text-base leading-relaxed text-dc-text-2 md:text-lg">
            Every engagement is different, but they all start the same way --
            a conversation about your operation. No slides, no pitch. Just an
            honest look at what you are dealing with.
          </p>
        </div>

        <ol className="flex flex-col gap-8">
          {STEPS.map((step) => (
            <li key={step.number} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-4">
                <span
                  aria-hidden="true"
                  className="text-xl font-bold tabular-nums text-[var(--color-brand)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.number}
                </span>
                <h3
                  className="text-xl font-semibold text-dc-text md:text-2xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.title}
                </h3>
              </div>
              <p className="pl-10 text-base leading-relaxed text-dc-text-2 md:text-lg">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </MotionSection>
  );
}

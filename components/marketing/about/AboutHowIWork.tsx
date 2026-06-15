// v2.0.0
// How I Work section. Blueprint refresh: ghost numeral "03", section
// border-top, dashed divider rules between steps.

import { Container } from "@/components/marketing/Container";
import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
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
      className="border-t border-dc-edge py-12 md:py-16"
    >
      <Container className="flex flex-col gap-10">
        <BlueprintSectionHeader
          numeral="03"
          kicker="How I work"
          heading="What an engagement actually looks like."
          subhead="Every engagement is different, but they all start the same way -- a conversation about your operation. No slides, no pitch. Just an honest look at what you are dealing with."
          id={HEADING_ID}
        />

        <ol className="flex flex-col max-w-2xl">
          {STEPS.map((step, i) => (
            <li key={step.number}>
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className="my-5 block h-px w-full"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, var(--color-dc-edge-2) 0 7px, transparent 7px 14px)",
                  }}
                />
              ) : null}
              <div className="flex items-baseline gap-4">
                <span
                  aria-hidden="true"
                  className="shrink-0 text-base font-bold tabular-nums text-[var(--color-brand)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.number}
                </span>
                <div className="flex flex-col gap-2">
                  <h3
                    className="text-xl font-semibold text-dc-text"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-base leading-relaxed text-dc-text-2">
                    {step.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </MotionSection>
  );
}

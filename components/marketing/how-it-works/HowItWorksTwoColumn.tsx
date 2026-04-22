// v1.0.0
// Two-column flow: manager (7 steps) left, worker (6 steps) right.
// Oversized Chakra Petch numerals at 40% brand opacity per the page
// override. At lg+ a 1px vertical divider between the columns animates
// scaleY(0) to scaleY(1) with origin-top on scroll (transform-only,
// 500ms easeOut, one shot). Stacks on <1024.

"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection } from "@/components/motion/MotionSection";

type Step = { title: string; body: string };

const MANAGER_STEPS: Step[] = [
  {
    title: "Upload the doc you already have",
    body: "PDF, Word, or a text file from the break-room laptop. No template, no new format.",
  },
  {
    title: "AI converts to Markdown and flags terms",
    body: "Claude Sonnet rewrites the SOP and surfaces every term it is unsure about.",
  },
  {
    title: "Define flagged terms",
    body: "You define each flagged term once. The glossary remembers it for every SOP after this one.",
  },
  {
    title: "Review and pick a template",
    body: "Step-by-step, reference, safety checklist, or onboarding. Edit anything Claude missed.",
  },
  {
    title: "Translate to Spanish",
    body: "Google Cloud Translation runs with your glossary as context. Your terms win over generic translations.",
  },
  {
    title: "Approve the Spanish",
    body: "One review screen, one approve button. Manager sign-off is a hard gate before publish.",
  },
  {
    title: "Print the QR and mount it",
    body: "Custom letter-size layout with your logo and phone number. Print, laminate, mount. Done.",
  },
];

const WORKER_STEPS: Step[] = [
  {
    title: "Get a magic link",
    body: "Manager sends it by email or text. Links expire in 72 hours and there are no passwords.",
  },
  {
    title: "Tap the link",
    body: "Signed in. Home dashboard loads in the worker's preferred language.",
  },
  {
    title: "See today's announcements",
    body: "Department posts and org-wide updates, translated and sorted by priority.",
  },
  {
    title: "Scan any QR",
    body: "Phone camera on the code, open the SOP. No search, no menu, no hunting.",
  },
  {
    title: "Read in English or Spanish",
    body: "Toggle any time. Both versions are already on device. No extra network trip.",
  },
  {
    title: "Works offline",
    body: "The last 20 SOPs stay cached. When the warehouse wifi drops to one bar, the procedure is still there.",
  },
];

function StepRow({ step, index }: { step: Step; index: number }) {
  const number = String(index + 1).padStart(2, "0");
  return (
    <li className="flex gap-5">
      <span
        aria-hidden="true"
        className="w-16 shrink-0 text-6xl font-bold leading-none tabular-nums text-[var(--color-brand)] opacity-40 md:w-20 md:text-7xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {number}
      </span>
      <div className="flex flex-col gap-2 pt-1 md:pt-2">
        <h3
          className="text-lg font-semibold text-dc-text md:text-xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {step.title}
        </h3>
        <p className="text-base leading-relaxed text-dc-text-2">
          {step.body}
        </p>
      </div>
    </li>
  );
}

function ColumnHeader({
  kicker,
  heading,
}: {
  kicker: string;
  heading: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {kicker}
      </span>
      <h3
        className="text-2xl font-semibold tracking-tight text-dc-text md:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {heading}
      </h3>
    </div>
  );
}

const SECTION_HEADING_ID = "hiw-twocolumn-heading";

export function HowItWorksTwoColumn() {
  return (
    <MotionSection
      aria-labelledby={SECTION_HEADING_ID}
      className="py-16 md:py-24"
    >
      <Container className="flex flex-col gap-12">
        <SectionHeader
          id={SECTION_HEADING_ID}
          eyebrow="Two roles, two flows"
          heading="One product, two very different days."
          subhead="The manager does setup. The worker does work. Neither gets the other's job on top of theirs."
          align="center"
        />

        <div className="relative grid gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            aria-hidden="true"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top" }}
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-dc-edge lg:block"
          />

          <div className="flex flex-col gap-8 lg:pr-8">
            <ColumnHeader
              kicker="Manager"
              heading="7 steps, about 15 minutes."
            />
            <ol className="flex flex-col gap-6">
              {MANAGER_STEPS.map((step, index) => (
                <StepRow key={step.title} step={step} index={index} />
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-8 lg:pl-8">
            <ColumnHeader
              kicker="Worker"
              heading="6 steps, about 30 seconds."
            />
            <ol className="flex flex-col gap-6">
              {WORKER_STEPS.map((step, index) => (
                <StepRow key={step.title} step={step} index={index} />
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </MotionSection>
  );
}

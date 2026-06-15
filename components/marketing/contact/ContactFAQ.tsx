// v1.0.0
// Short contact FAQ: three questions, hand-rolled accordion (same
// pattern as the pricing FAQ). Aria wiring via aria-expanded,
// aria-controls, aria-labelledby. Max-height transition; reduced
// motion is respected via the global CSS rule in app/globals.css.

"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";

type QA = { question: string; answer: string };

const FAQ: QA[] = [
  {
    question: "How fast can I get started?",
    answer:
      "Sign up, upload your worst SOP, and you can have the first bilingual QR mounted on the floor in about fifteen minutes. No kickoff call required.",
  },
  {
    question: "Do you offer a demo?",
    answer:
      "Yes. Send a note and Rob will walk you through the product with a real SOP from your warehouse. Takes twenty minutes, no slides.",
  },
  {
    question: "Can I pilot with one warehouse first?",
    answer:
      "That is the best way to start. Stand it up on one facility, see the scan analytics for a few weeks, then roll to the rest. Pricing is flat rate, so the pilot is the same price as the rollout.",
  },
  {
    question: "What does a typical consulting engagement look like?",
    answer:
      "It starts with a half-day discovery session, on-site or via video. I give you a written findings report within five business days. From there we scope the work together -- project, retainer, or fractional depending on what you actually need.",
  },
  {
    question: "Do you work with facilities outside Utah?",
    answer:
      "Yes. Most consulting work is remote-first with on-site visits as needed. Travel is scoped into the project cost upfront so there are no surprises.",
  },
];

const HEADING_ID = "contact-faq-heading";

function Item({
  qa,
  idBase,
  open,
  onToggle,
}: {
  qa: QA;
  idBase: string;
  open: boolean;
  onToggle: () => void;
}) {
  const buttonId = `${idBase}-q`;
  const panelId = `${idBase}-a`;

  return (
    <div className="border-b border-dc-edge last:border-b-0">
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-6 py-4 text-left text-dc-text hover:text-[var(--color-brand)] transition-colors"
      >
        <span
          className="text-base font-semibold md:text-lg"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {qa.question}
        </span>
        <ChevronDown
          className={[
            "h-5 w-5 shrink-0 transition-transform duration-200 ease-out",
            open ? "rotate-180" : "rotate-0",
          ].join(" ")}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        style={{
          maxHeight: open ? "300px" : "0px",
          transition: "max-height 250ms ease-out",
          overflow: "hidden",
        }}
      >
        <p className="pb-4 pr-10 text-base leading-relaxed text-dc-text-2">
          {qa.answer}
        </p>
      </div>
    </div>
  );
}

export function ContactFAQ() {
  const reactId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="py-10 md:py-16"
    >
      <Container width="prose" className="flex flex-col gap-6">
        <h2
          id={HEADING_ID}
          className="text-2xl font-semibold tracking-tight text-dc-text md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Frequently asked.
        </h2>
        <div>
          {FAQ.map((qa, index) => (
            <Item
              key={qa.question}
              qa={qa}
              idBase={`${reactId}-${index}`}
              open={openIndex === index}
              onToggle={() =>
                setOpenIndex((current) => (current === index ? null : index))
              }
            />
          ))}
        </div>
      </Container>
    </MotionSection>
  );
}

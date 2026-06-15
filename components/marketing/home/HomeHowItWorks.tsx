// v2.0.0
// "How I work" section (previously "How It Works").
// Reframed from app workflow (Upload/AI/Scan) to consulting engagement:
// 01 Diagnose · 02 Build & train · 03 Hand off.
// Blueprint treatment: ghost numerals, dashed connector line, section border.

import { CheckCircle, Search, Wrench } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-hiw-heading";

type Step = {
  number: string;
  icon: ReactNode;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    icon: <Search className="h-5 w-5" strokeWidth={2} />,
    title: "Diagnose",
    body: "Half-day discovery on-site or remote. I look at your workflows, talk to your team, and find where decisions are breaking down. You get a written findings report within five business days -- yours to keep regardless of what comes next.",
  },
  {
    number: "02",
    icon: <Wrench className="h-5 w-5" strokeWidth={2} />,
    title: "Build and train",
    body: "We scope the work together: project, retainer, or fractional. I build the systems, processes, and accountability structures your existing team needs. Your supervisors and managers are in the room for every decision so they own it when I leave.",
  },
  {
    number: "03",
    icon: <CheckCircle className="h-5 w-5" strokeWidth={2} />,
    title: "Hand off",
    body: "The engagement ends when your team is running without me in the room. That is not the starting point -- it is the goal. No ongoing dependency, no account manager, no retainer you cannot cancel.",
  },
];

export function HomeHowItWorks() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="border-t border-dc-edge py-16 md:py-24"
    >
      <Container className="flex flex-col gap-12">
        {/* Section header with ghost numeral */}
        <MotionSectionItem>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 shrink-0"
                style={{ background: "var(--color-brand)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                How I work
              </span>
            </div>
            <h2
              id={HEADING_ID}
              className="text-dc-text"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "clamp(26px,3.4vw,44px)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              Diagnose. Build. Hand off.
            </h2>
            <p className="text-base leading-relaxed text-dc-text-2 max-w-xl">
              Every engagement follows the same three phases, regardless of scope. The details change. The structure does not.
            </p>
          </div>
        </MotionSectionItem>

        {/* Steps */}
        <MotionSectionItem>
          <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, i) => (
              <li key={step.number} className="relative flex flex-col gap-4">
                {/* Dashed connector (between steps, desktop only) */}
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-3 top-5 hidden h-px w-6 md:block"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg, var(--color-dc-edge-2) 0 7px, transparent 7px 14px)",
                    }}
                  />
                ) : null}

                {/* Ghost numeral */}
                <span
                  aria-hidden="true"
                  className="select-none leading-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "clamp(40px,5vw,72px)",
                    lineHeight: 0.85,
                    letterSpacing: "-0.02em",
                    color: "transparent",
                    WebkitTextStroke: "1.5px var(--color-dc-edge-2)",
                  }}
                >
                  {step.number}
                </span>

                {/* Icon */}
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md"
                  style={{
                    background: "color-mix(in srgb, var(--color-brand) 12%, transparent)",
                    color: "var(--color-brand)",
                  }}
                  aria-hidden="true"
                >
                  {step.icon}
                </div>

                <h3
                  className="text-xl font-semibold text-dc-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-dc-text-2">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </MotionSectionItem>

        <MotionSectionItem>
          <Button href="/services" variant="secondary" size="md">
            See the full engagement overview
          </Button>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

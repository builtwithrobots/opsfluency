// v3.0.0
// About hero. Blueprint refresh: 2-col on lg+ (prose left, portrait +
// Operator File panel right). Portrait is a 4:5 placeholder with corner
// ticks and "ROB · FOUNDER" caption. Operator File is a mono mini-panel
// below the portrait.

import { User } from "lucide-react";

import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

function FounderPortrait() {
  return (
    <div className="flex flex-col gap-3">
      {/* Portrait frame */}
      <FramedPanel withCornerTicks className="relative overflow-hidden bg-dc-raised">
        <div
          className="flex items-center justify-center"
          style={{ aspectRatio: "4/5" }}
        >
          {/* Placeholder: swap this div for a real <Image> when portrait is available */}
          <div className="flex flex-col items-center gap-3 text-dc-text-3">
            <User className="h-16 w-16 opacity-30" strokeWidth={1} />
          </div>
        </div>
        {/* Caption bar */}
        <div className="border-t border-dc-edge px-4 py-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Rob · Founder
          </span>
        </div>
      </FramedPanel>

      {/* Operator File mini-panel */}
      <FramedPanel className="px-4 py-3">
        <p
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Operator File
        </p>
        <dl className="flex flex-col gap-1.5">
          {[
            { key: "Experience", value: "20 yrs" },
            { key: "Path", value: "Floor → Dir. Ops" },
            { key: "Sites", value: "3 simultaneous" },
          ].map(({ key, value }) => (
            <div key={key} className="flex items-baseline justify-between gap-4">
              <dt
                className="text-xs text-dc-text-3"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {key}
              </dt>
              <dd
                className="text-xs font-semibold text-dc-text"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </FramedPanel>
    </div>
  );
}

export function AboutHero() {
  return (
    <MotionSection
      aria-label="About"
      variants={staggerContainer}
      className="py-20 md:py-28"
    >
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text column */}
          <div className="flex flex-col gap-6">
            <MotionSectionItem>
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
                  About
                </span>
              </div>
            </MotionSectionItem>

            <MotionSectionItem>
              <h1
                className="text-dc-text"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "clamp(34px,5vw,62px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                Built by an operator, for operators.
              </h1>
            </MotionSectionItem>

            <MotionSectionItem>
              <p className="text-lg leading-relaxed text-dc-text-2">
                I am not a consultant who found an interesting industry. I spent
                twenty years in it -- from the floor to Director of Operations
                across three simultaneous sites. I built OpsFluency because I
                needed it and it did not exist. Now I use it with every client.
              </p>
            </MotionSectionItem>
          </div>

          {/* Portrait + Operator File */}
          <MotionSectionItem>
            <div className="max-w-xs mx-auto lg:mx-0">
              <FounderPortrait />
            </div>
          </MotionSectionItem>
        </div>
      </Container>
    </MotionSection>
  );
}

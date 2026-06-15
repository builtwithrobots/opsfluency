// v1.0.0
// Coming soon tools section. "In development" badge, body copy about
// what is being built, and a ghost CTA to /contact for custom builds.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "tools-coming-soon-heading";

export function ToolsComingSoon() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="py-16 md:py-24"
    >
      <Container>
        <MotionSectionItem>
          <div className="flex flex-col gap-6 rounded-2xl border border-dc-edge bg-dc-surface p-8 md:p-12">
            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{
                background:
                  "color-mix(in srgb, var(--color-signal-warn) 12%, transparent)",
                color: "var(--color-signal-warn)",
              }}
            >
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 animate-calm-pulse rounded-full bg-[var(--color-signal-warn)]"
              />
              In development
            </span>

            <h2
              id={HEADING_ID}
              className="text-2xl font-bold tracking-tight text-dc-text md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              More tools coming.
            </h2>

            <p className="max-w-2xl text-base leading-relaxed text-dc-text-2 md:text-lg">
              Every operational problem I work on becomes a candidate for the
              next tool. Current candidates include a shift handoff tracker, a
              compliance audit checklist builder, and a visual work instruction
              generator for equipment with no written SOP.
            </p>

            <p className="text-base leading-relaxed text-dc-text-2">
              If you have a specific workflow problem that no tool solves
              cleanly, {"let's"} talk about whether a custom build makes sense.
            </p>

            <Button
              href="/contact"
              variant="ghost"
              size="md"
              trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
            >
              Talk to Rob
            </Button>
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

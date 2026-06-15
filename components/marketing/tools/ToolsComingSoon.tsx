// v2.0.0
// Blueprint refresh: BlueprintSectionHeader numeral "02", FramedPanel,
// signal-warn badge matching AboutRoadmap style.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "tools-coming-soon-heading";

export function ToolsComingSoon() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="border-t border-dc-edge py-12 md:py-16"
    >
      <Container className="flex flex-col gap-10">
        <BlueprintSectionHeader
          numeral="02"
          kicker="In development"
          heading="More tools coming."
          id={HEADING_ID}
        />

        <FramedPanel className="flex flex-col gap-5 p-8 max-w-3xl">
          {/* Badge */}
          <span
            className="inline-flex items-center gap-2 self-start rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{
              background: "color-mix(in srgb, var(--color-signal-warn) 12%, transparent)",
              color: "var(--color-signal-warn)",
              border: "1px solid color-mix(in srgb, var(--color-signal-warn) 25%, transparent)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 shrink-0 animate-calm-pulse rounded-full bg-[var(--color-signal-warn)]"
            />
            In development
          </span>

          <p className="text-base leading-relaxed text-dc-text-2">
            Every operational problem I work on becomes a candidate for the
            next tool. Current candidates include a shift handoff tracker, a
            compliance audit checklist builder, and a visual work instruction
            generator for equipment with no written SOP.
          </p>

          <p className="text-base leading-relaxed text-dc-text-2">
            If you have a specific workflow problem that no tool solves
            cleanly, {"let's"} talk about whether a custom build makes sense.
          </p>

          <div>
            <Button
              href="/contact"
              variant="ghost"
              size="md"
              trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
            >
              Talk to Rob
            </Button>
          </div>
        </FramedPanel>
      </Container>
    </MotionSection>
  );
}

// v2.0.0
// Blueprint refresh: contained teal gradient panel with white corner
// ticks. Matches HomeFinalCTA pattern.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";

export function ToolsCTA() {
  return (
    <MotionSection
      aria-label="Talk to Rob"
      className="border-t border-dc-edge py-12 md:py-16"
    >
      <Container>
        <div
          className="relative isolate overflow-hidden rounded-[4px] px-8 py-12 text-center md:px-16 md:py-16"
          style={{
            background:
              "linear-gradient(135deg, var(--color-brand-dim) 0%, var(--color-brand) 100%)",
          }}
        >
          {/* White corner ticks */}
          {(["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"] as const).map(
            (pos, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`pointer-events-none absolute ${pos} inline-block h-4 w-4`}
                style={{
                  borderColor: "rgba(255,255,255,0.5)",
                  borderStyle: "solid",
                  borderWidth: i === 0 ? "2px 0 0 2px" : i === 1 ? "2px 2px 0 0" : i === 2 ? "0 0 2px 2px" : "0 2px 2px 0",
                }}
              />
            ),
          )}

          <div className="relative flex flex-col items-center gap-6">
            <h2
              className="max-w-2xl text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "clamp(26px,3.4vw,44px)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              {"Let's talk about your operation."}
            </h2>

            <p className="max-w-lg text-base leading-relaxed text-white/85">
              You are not talking to a receptionist or a sales rep. You are
              talking to Rob.
            </p>

            <Button
              href="/contact"
              size="lg"
              className="bg-white text-[var(--color-brand-dim)] hover:bg-white/90"
              trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
            >
              Talk to Rob
            </Button>
          </div>
        </div>
      </Container>
    </MotionSection>
  );
}

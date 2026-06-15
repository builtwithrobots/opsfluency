// v4.0.0
// Home page final CTA. Blueprint refresh: contained teal panel with
// corner ticks (not full-bleed). Secondary CTA → "See my services".
// Subhead focuses on the consulting practice, not platform.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

export function HomeFinalCTA() {
  return (
    <MotionSection
      aria-label="Talk to Rob"
      variants={staggerContainer}
      className="border-t border-dc-edge py-20 md:py-32"
    >
      <Container>
        <MotionSectionItem>
          <div
            className="relative overflow-hidden rounded-lg px-8 py-14 text-center md:px-16 md:py-20"
            style={{
              background:
                "linear-gradient(135deg, var(--color-brand), var(--color-brand-dim))",
            }}
          >
            {/* Corner ticks (white at 60% alpha) */}
            {(["tl", "tr", "bl", "br"] as const).map((pos) => {
              const posClass = {
                tl: "-top-px -left-px border-t-2 border-l-2",
                tr: "-top-px -right-px border-t-2 border-r-2",
                bl: "-bottom-px -left-px border-b-2 border-l-2",
                br: "-bottom-px -right-px border-b-2 border-r-2",
              }[pos];
              return (
                <span
                  key={pos}
                  aria-hidden="true"
                  className={`pointer-events-none absolute h-5 w-5 ${posClass}`}
                  style={{ borderColor: "rgba(255,255,255,0.6)" }}
                />
              );
            })}

            <h2
              className="mx-auto max-w-2xl text-white"
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
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/85">
              No pitch deck. No sales cycle. One honest conversation about what
              you are dealing with and what would actually help.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                href="/contact"
                size="lg"
                className="bg-white text-[var(--color-brand-dim)] hover:bg-white/90"
                trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
              >
                Talk to Rob
              </Button>
              <Button
                href="/services"
                variant="secondary"
                size="lg"
                className="border-white/40 text-white hover:border-white/60 hover:bg-white/10"
              >
                See my services
              </Button>
            </div>
          </div>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

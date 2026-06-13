// v1.0.0
// Tools page. Lists current tools with OpsFluency Platform as Tool #1
// and a placeholder for future tools. Copy sourced verbatim from
// docs/branding/pivot061226/consultancy-homepage.md §5.

import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

export const metadata: Metadata = {
  title: "Tools — OpsFluency",
  description:
    "The tools Rob Ramos uses with every operations engagement. OpsFluency Platform: bilingual SOP delivery, QR codes at the machines, company glossary, and OSHA comprehension records. Flat rate per facility.",
};

const PAGE_HEADING_ID = "tools-heading";

export default function ToolsPage() {
  return (
    <>
      {/* Page intro */}
      <MotionSection
        aria-labelledby={PAGE_HEADING_ID}
        variants={staggerContainer}
        className="py-20 md:py-28"
      >
        <Container className="flex flex-col gap-6">
          <MotionSectionItem>
            <span
              className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Tools
            </span>
          </MotionSectionItem>
          <MotionSectionItem>
            <h1
              id={PAGE_HEADING_ID}
              className="max-w-3xl text-5xl font-bold tracking-tight text-dc-text md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              The tools I use with every client
            </h1>
          </MotionSectionItem>
          <MotionSectionItem>
            <p className="max-w-2xl text-lg leading-relaxed text-dc-text-2 md:text-xl">
              {"Built because they didn't exist. Used in every engagement."}
            </p>
          </MotionSectionItem>
        </Container>
      </MotionSection>

      {/* Tool cards */}
      <MotionSection
        aria-label="Tools list"
        variants={staggerContainer}
        className="py-16 md:py-24 bg-dc-raised"
      >
        <Container>
          <MotionSectionItem>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Tool 1: OpsFluency Platform */}
              <div className="flex flex-col gap-4 rounded-lg border border-[var(--color-brand)]/30 bg-dc-surface p-6">
                <h2
                  className="text-lg font-bold tracking-tight text-dc-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  OpsFluency Platform
                </h2>
                <p className="flex-1 text-sm leading-relaxed text-dc-text-2">
                  Bilingual SOP delivery, QR codes mounted at the machines, company
                  glossary that gets smarter with every document, and OSHA-compliant
                  comprehension records. Flat rate per facility — not per seat.
                </p>
                <Button
                  href="https://app.opsfluency.com"
                  variant="secondary"
                  size="sm"
                  trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
                >
                  Try it free for 14 days
                </Button>
              </div>

              {/* Tool 2: Placeholder */}
              <div className="flex flex-col gap-4 rounded-lg border border-dc-edge bg-dc-surface p-6">
                <h2
                  className="text-lg font-bold tracking-tight text-dc-text-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  More tools coming.
                </h2>
                <p className="flex-1 text-sm leading-relaxed text-dc-text-3">
                  Every operational problem I work on becomes a candidate for the next
                  tool. If you have a specific workflow problem, let&apos;s talk about
                  whether a custom build makes sense.
                </p>
              </div>
            </div>
          </MotionSectionItem>
        </Container>
      </MotionSection>

      {/* Final CTA */}
      <MotionSection
        aria-label="Talk to Rob"
        variants={staggerContainer}
        className="relative isolate overflow-hidden bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dim)] py-20 md:py-32"
      >
        <Container className="flex flex-col items-center gap-8 text-center text-white">
          <MotionSectionItem>
            <h2
              className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {"Let's talk about your operation."}
            </h2>
          </MotionSectionItem>
          <MotionSectionItem>
            <p className="max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
              {"I've seen all of it. I can help."}
            </p>
          </MotionSectionItem>
          <MotionSectionItem>
            <Button
              href="/contact"
              size="lg"
              className="bg-white text-[var(--color-brand-dim)] hover:bg-white/90"
              trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
            >
              Talk to Rob
            </Button>
          </MotionSectionItem>
        </Container>
      </MotionSection>
    </>
  );
}

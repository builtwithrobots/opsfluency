// v1.0.0
// What I Do page. Three service lanes expanded with full descriptions,
// who-they're-for context, and format details sourced from
// docs/branding/pivot061226/brand-architecture.md.

import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

export const metadata: Metadata = {
  title: "What I Do — OpsFluency",
  description:
    "Three ways to work with Rob Ramos: Operations Consulting, Platform Setup, and Custom Tools. On-site or remote. Project-based, retainer, or one-time setup.",
};

const PAGE_HEADING_ID = "what-i-do-heading";

type Service = {
  number: string;
  title: string;
  oneLiner: string;
  description: string;
  whoFor: string;
  format: string;
  raised: boolean;
};

const SERVICES: Service[] = [
  {
    number: "01",
    title: "Operations Consulting",
    oneLiner:
      "An experienced Director-level eye on your operation, without the full-time Director overhead.",
    description:
      "Workflow assessment, SOP development, process improvement, team alignment. On-site or remote. I look at your operation the way I looked at every facility I've managed — with fresh eyes and a floor perspective.",
    whoFor:
      "Facilities that need a clear-eyed outside assessment of what's broken and a plan to fix it. Rob has done this before — self-employed consulting practice, 2018–2019.",
    format: "Project-based or monthly retainer.",
    raised: false,
  },
  {
    number: "02",
    title: "Platform Setup",
    oneLiner: "The platform, implemented by the person who built it.",
    description:
      "Full implementation of the OpsFluency platform. SOP import, company glossary setup, bilingual publishing, QR code installation, manager training. Done right the first time, by the person who built it.",
    whoFor:
      "Facilities that want to implement the platform but want Rob to do it right the first time instead of figuring it out themselves.",
    format: "One-time setup fee + platform subscription.",
    raised: true,
  },
  {
    number: "03",
    title: "Custom Tools",
    oneLiner: "If the right tool doesn't exist yet, I'll build it.",
    description:
      "Some operational problems don't have an off-the-shelf answer. I build purpose-built applications for specific workflows and compliance requirements. Scoped per project.",
    whoFor:
      "Facilities with a specific workflow or compliance problem that no existing tool solves.",
    format: "Discovery call → proposal → build.",
    raised: false,
  },
];

function ServiceSection({
  number,
  title,
  oneLiner,
  description,
  whoFor,
  format,
  raised,
}: Service) {
  const headingId = `service-${number}-heading`;
  return (
    <MotionSection
      aria-labelledby={headingId}
      variants={staggerContainer}
      className={["py-16 md:py-24", raised ? "bg-dc-raised" : ""].filter(Boolean).join(" ")}
    >
      <Container>
        <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
          <MotionSectionItem className="flex flex-col gap-4">
            <span
              className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {number}
            </span>
            <h2
              id={headingId}
              className="text-3xl font-bold tracking-tight text-dc-text md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h2>
            <p className="text-base italic leading-relaxed text-[var(--color-brand)]">
              {oneLiner}
            </p>
          </MotionSectionItem>

          <MotionSectionItem className="flex flex-col gap-6">
            <p className="text-base leading-relaxed text-dc-text-2 md:text-lg">
              {description}
            </p>
            <div className="flex flex-col gap-2 rounded-lg border border-dc-edge bg-dc-surface p-5">
              <span
                className="text-xs font-semibold uppercase tracking-widest text-dc-text-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {"Who it's for"}
              </span>
              <p className="text-sm leading-relaxed text-dc-text-2">{whoFor}</p>
            </div>
            <p className="text-sm italic text-dc-text-3">{format}</p>
          </MotionSectionItem>
        </div>
      </Container>
    </MotionSection>
  );
}

export default function WhatIDoPage() {
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
              What I Do
            </span>
          </MotionSectionItem>
          <MotionSectionItem>
            <h1
              id={PAGE_HEADING_ID}
              className="max-w-3xl text-5xl font-bold tracking-tight text-dc-text md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Three ways to work together
            </h1>
          </MotionSectionItem>
        </Container>
      </MotionSection>

      {/* Three expanded service sections */}
      {SERVICES.map((service) => (
        <ServiceSection key={service.number} {...service} />
      ))}

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
              {"Not sure which fits?"}
            </h2>
          </MotionSectionItem>
          <MotionSectionItem>
            <p className="max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
              {"That's what the first call is for."}
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

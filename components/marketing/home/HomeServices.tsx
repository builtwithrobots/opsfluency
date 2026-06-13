// v1.0.0
// Services section. Three service lane cards (Operations Consulting,
// Platform Setup, Custom Tools) with a low-stakes CTA below.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-services-heading";

type ServiceCard = {
  title: string;
  description: string;
  format: string;
};

const SERVICES: ServiceCard[] = [
  {
    title: "Operations Consulting",
    description:
      "Workflow assessment, SOP development, process improvement, team alignment. On-site or remote. I look at your operation the way I looked at every facility I've managed — with fresh eyes and a floor perspective.",
    format: "Project-based or monthly retainer.",
  },
  {
    title: "Platform Setup",
    description:
      "Full implementation of the OpsFluency platform. SOP import, company glossary setup, bilingual publishing, QR code installation, manager training. Done right the first time, by the person who built it.",
    format: "One-time setup fee + platform subscription.",
  },
  {
    title: "Custom Tools",
    description:
      "Some operational problems don't have an off-the-shelf answer. I build purpose-built applications for specific workflows and compliance requirements. Scoped per project.",
    format: "Discovery call → proposal → build.",
  },
];

function ServiceCard({ title, description, format }: ServiceCard) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-dc-edge bg-dc-surface p-6">
      <h3
        className="text-lg font-bold tracking-tight text-dc-text"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="flex-1 text-sm leading-relaxed text-dc-text-2">
        {description}
      </p>
      <p className="text-xs italic text-dc-text-3">{format}</p>
    </div>
  );
}

export function HomeServices() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="py-16 md:py-24 bg-dc-raised"
    >
      <Container className="flex flex-col gap-12">
        <MotionSectionItem>
          <SectionHeader
            id={HEADING_ID}
            heading="Three ways to work together"
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid gap-6 md:grid-cols-3">
            {SERVICES.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </MotionSectionItem>
        <MotionSectionItem className="flex flex-col items-center gap-4 text-center">
          <p className="text-base text-dc-text-2">
            {"Not sure which fits? That's what the first call is for."}
          </p>
          <Button
            href="/contact"
            variant="secondary"
            size="md"
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
          >
            Talk to Rob
          </Button>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

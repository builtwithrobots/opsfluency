// v3.0.0
// Services section. Blueprint refresh: ghost numeral "02", section border,
// FramedPanel cards with sharp corners and S1/S2/S3 mono tags.
// Featured (Fractional) gets teal top border + brand glow.

import { ArrowRight, ClipboardList, Layers, Users, Wrench } from "lucide-react";
import type { ReactNode } from "react";

import { BlueprintSectionHeader } from "@/components/marketing/BlueprintSectionHeader";
import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { FramedPanel } from "@/components/marketing/FramedPanel";
import { MotionSection, MotionSectionItem } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";

const HEADING_ID = "home-services-heading";

type ServiceCard = {
  tag: string;
  icon: ReactNode;
  title: string;
  description: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
  featured?: boolean;
};

const SERVICES: ServiceCard[] = [
  {
    tag: "S1",
    icon: <Users className="h-5 w-5" strokeWidth={2} />,
    title: "Fractional Operations Leadership",
    description:
      "Most facilities do not have a leadership gap. They have a systems gap. I come in, assess where decisions are breaking down, and build the workflows and processes your existing team needs to own the operation themselves. No new layers of management. No dependency on me staying. When the engagement ends, your supervisors and mid-level managers are making better decisions, holding each other accountable, and running a floor that does not need me in the room.",
    detail: "Weekly or bi-weekly engagement. Minimum three months.",
    ctaLabel: "Talk to Rob",
    ctaHref: "/contact",
    featured: true,
  },
  {
    tag: "S2",
    icon: <ClipboardList className="h-5 w-5" strokeWidth={2} />,
    title: "Operations Consulting",
    description:
      "Workflow assessment, SOP development, process redesign, team alignment. On-site or remote. Starts with a half-day discovery session. You get a written findings report within five business days. Most discovery sessions turn into something bigger once you see how much there is to fix.",
    detail: "Project-based or monthly retainer.",
    ctaLabel: "Start with a discovery",
    ctaHref: "/contact",
  },
  {
    tag: "S3",
    icon: <Layers className="h-5 w-5" strokeWidth={2} />,
    title: "Platform Setup",
    description:
      "Full implementation of the OpsFluency platform. SOP import, glossary setup, bilingual publishing, QR code installation, manager training. Done right the first time, by the person who built it.",
    detail: "One-time setup fee plus monthly subscription.",
    ctaLabel: "See the platform",
    ctaHref: "/tools",
  },
  {
    tag: "S4",
    icon: <Wrench className="h-5 w-5" strokeWidth={2} />,
    title: "Custom Tools",
    description:
      "Some operational problems do not have an off-the-shelf answer. I build purpose-built applications for specific workflows and compliance requirements. Scoped per project.",
    detail: "Discovery call -- proposal -- build.",
    ctaLabel: "Talk to Rob",
    ctaHref: "/contact",
  },
];

function Card({
  tag,
  icon,
  title,
  description,
  detail,
  ctaLabel,
  ctaHref,
  ctaExternal,
  featured,
}: ServiceCard) {
  return (
    <FramedPanel
      featured={featured}
      hoverable
      className="flex flex-col gap-5 p-6"
    >
      {/* Mono tag + icon */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dc-text-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {tag}
        </span>
        <div
          className="inline-flex h-10 w-10 items-center justify-center rounded-md"
          style={{
            background: "color-mix(in srgb, var(--color-brand) 12%, transparent)",
            color: "var(--color-brand)",
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      {/* Copy */}
      <div className="flex flex-1 flex-col gap-3">
        <h3
          className="text-base font-bold tracking-tight text-dc-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-dc-text-2">
          {description}
        </p>
        <p
          className="text-[11px] italic text-dc-text-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {detail}
        </p>
      </div>

      <Button
        href={ctaHref}
        variant="ghost"
        size="sm"
        {...(ctaExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="w-fit min-h-[44px]"
        trailingIcon={<ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />}
      >
        {ctaLabel}
      </Button>
    </FramedPanel>
  );
}

export function HomeServices() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      variants={staggerContainer}
      className="border-t border-dc-edge py-16 md:py-24"
    >
      <Container className="flex flex-col gap-12">
        <MotionSectionItem>
          <BlueprintSectionHeader
            numeral="02"
            kicker="How I can help"
            heading="Four ways to work together."
            subhead="Every engagement starts with a conversation. We figure out what you actually need before anything else."
            id={HEADING_ID}
          />
        </MotionSectionItem>
        <MotionSectionItem>
          <div className="grid gap-5 md:grid-cols-2">
            {SERVICES.map((service) => (
              <Card key={service.title} {...service} />
            ))}
          </div>
        </MotionSectionItem>
        <MotionSectionItem>
          <p className="text-sm text-dc-text-2">
            Most engagements start with one conversation and grow from there.
            Not sure which fits? That is what the first call is for.
          </p>
        </MotionSectionItem>
      </Container>
    </MotionSection>
  );
}

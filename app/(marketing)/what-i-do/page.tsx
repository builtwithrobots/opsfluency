// v2.0.0
// What I Do page. Refactored into components. Four service cards
// rendered with WhatIDoServiceCard -- Fractional Operations Leadership
// first, per the site audit June 2026.

import type { Metadata } from "next";

import { WhatIdoCTA } from "@/components/marketing/what-i-do/WhatIdoCTA";
import { WhatIDoHero } from "@/components/marketing/what-i-do/WhatIDoHero";
import {
  WhatIDoServiceCard,
  type WhatIDoServiceCardProps,
} from "@/components/marketing/what-i-do/WhatIDoServiceCard";

export const metadata: Metadata = {
  title: "What I Do -- OpsFluency",
  description:
    "Four ways to work with Rob Ramos: Fractional Operations Leadership, Operations Consulting, Platform Setup, and Custom Tools. On-site or remote. Project-based, retainer, or one-time setup.",
};

const SERVICES: WhatIDoServiceCardProps[] = [
  {
    number: "01",
    title: "Fractional Operations Leadership",
    tagline: "Build the systems. Empower the team. Walk away clean.",
    description:
      "Most facilities do not have a leadership gap. They have a systems gap. I come in, assess where decisions are breaking down, and build the workflows and processes your existing team needs to own the operation themselves. No new layers of management. No dependency on me staying. When the engagement ends, your supervisors and mid-level managers are making better decisions, holding each other accountable, and running a floor that does not need me in the room. That is the whole point.",
    whoItsFor:
      "Facilities that are growing faster than their systems can handle, or that have lost senior ops leadership and need someone to stabilize the operation and build the team's capability before making a permanent hire.",
    detail: "Weekly or bi-weekly engagement. Minimum three months. Starts at $3,000 per month.",
    ctaLabel: "Talk to Rob",
    ctaHref: "/contact",
  },
  {
    number: "02",
    title: "Operations Consulting",
    tagline:
      "An experienced Director-level eye on your operation, without the full-time Director overhead.",
    description:
      "Workflow assessment, SOP development, process improvement, team alignment. On-site or remote. I look at your operation the way I looked at every facility I have managed -- with fresh eyes and a floor perspective.",
    whoItsFor:
      "Facilities that need a clear-eyed outside look at what is broken and a realistic plan to fix it. No report that sits in a drawer. Findings you can act on next week.",
    detail:
      "Discovery session $1,500. Project-based or monthly retainer from there.",
    ctaLabel: "Start with a discovery",
    ctaHref: "/contact",
    raised: true,
  },
  {
    number: "03",
    title: "Platform Setup",
    tagline: "The platform, implemented by the person who built it.",
    description:
      "Full implementation of the OpsFluency platform. SOP import, company glossary setup, bilingual publishing, QR code installation, manager training. Done right the first time.",
    whoItsFor:
      "Facilities that want to implement the platform but want it set up correctly from day one instead of figuring it out themselves.",
    detail: "One-time setup fee from $1,500. Plus monthly platform subscription.",
    ctaLabel: "See the platform",
    ctaHref: "https://app.opsfluency.com",
    ctaExternal: true,
  },
  {
    number: "04",
    title: "Custom Tools",
    tagline: "If the right tool does not exist yet, I will build it.",
    description:
      "Some operational problems do not have an off-the-shelf answer. I build purpose-built applications for specific workflows and compliance requirements. Scoped per project.",
    whoItsFor:
      "Facilities with a specific workflow or compliance problem that no existing tool solves cleanly.",
    detail: "Discovery call -- proposal -- build. Priced per project.",
    ctaLabel: "Talk to Rob",
    ctaHref: "/contact",
    raised: true,
  },
];

export default function WhatIDoPage() {
  return (
    <>
      <WhatIDoHero />
      {SERVICES.map((service) => (
        <WhatIDoServiceCard key={service.number} {...service} />
      ))}
      <WhatIdoCTA />
    </>
  );
}

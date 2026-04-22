// v1.0.0
// Tech stack in plain terms. Five cards in a 2 x 5 responsive grid.
// The 5-column grid on lg+ is the one place grid-cols-5 appears on the
// marketing site (documented as a how-it-works deviation in the page
// override).

import {
  Cloud,
  Database,
  KeyRound,
  Languages,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import { Container } from "@/components/marketing/Container";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MotionSection } from "@/components/motion/MotionSection";

type Card = { icon: ReactNode; name: string; role: string };

const CARDS: Card[] = [
  {
    icon: <Sparkles className="h-5 w-5" strokeWidth={2} />,
    name: "Claude Sonnet",
    role: "Rewrites your SOPs as Markdown and flags terms a generic translator would mangle.",
  },
  {
    icon: <Languages className="h-5 w-5" strokeWidth={2} />,
    name: "Google Translate",
    role: "Your glossary gets injected on every call. Your term wins over the generic translation.",
  },
  {
    icon: <KeyRound className="h-5 w-5" strokeWidth={2} />,
    name: "Clerk",
    role: "Magic-link sign-in for workers. No passwords. Links expire in 72 hours.",
  },
  {
    icon: <Database className="h-5 w-5" strokeWidth={2} />,
    name: "Supabase",
    role: "Postgres for everything, with Row Level Security so tenants cannot see each other.",
  },
  {
    icon: <Cloud className="h-5 w-5" strokeWidth={2} />,
    name: "Vercel",
    role: "Edge CDN, automatic previews on every branch, production deploys in a minute.",
  },
];

const HEADING_ID = "hiw-under-hood-heading";

export function HowItWorksUnderHood() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="py-16 md:py-24 bg-dc-raised"
    >
      <Container className="flex flex-col gap-12">
        <SectionHeader
          id={HEADING_ID}
          eyebrow="Under the hood"
          heading="The stack in plain terms."
          subhead="Boring technology, well integrated. Nothing on this list is experimental, and every piece is replaceable."
          align="center"
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-5">
          {CARDS.map((card) => (
            <div
              key={card.name}
              className="flex flex-col gap-3 rounded-xl border border-dc-edge bg-dc-surface p-5"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] text-[var(--color-brand)]"
              >
                {card.icon}
              </span>
              <h3
                className="text-sm font-semibold text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {card.name}
              </h3>
              <p className="text-xs leading-relaxed text-dc-text-2">
                {card.role}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </MotionSection>
  );
}

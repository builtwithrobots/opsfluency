// v1.0.0
// Direct channels. Two cards side by side on md+, stacked on mobile.
// Email opens the default mail client, LinkedIn opens a new tab.

import { Linkedin, Mail } from "lucide-react";
import type { ReactNode } from "react";

import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";

const HEADING_ID = "contact-channels-heading";

type Channel = {
  title: string;
  blurb: string;
  cta: string;
  href: string;
  icon: ReactNode;
  external?: boolean;
};

const CHANNELS: Channel[] = [
  {
    title: "Direct email",
    blurb: "Hits Rob's inbox. Reply usually same business day, often faster.",
    cta: "rob@opsfluency.com",
    href: "mailto:rob@opsfluency.com",
    icon: <Mail className="h-5 w-5" strokeWidth={2} />,
  },
  {
    title: "LinkedIn",
    blurb: "Public comments, DMs, or a connect request. Same human on the other end.",
    cta: "opsfluency on LinkedIn",
    href: "https://www.linkedin.com/company/opsfluency",
    icon: <Linkedin className="h-5 w-5" strokeWidth={2} />,
    external: true,
  },
];

export function ContactDirectChannels() {
  return (
    <MotionSection
      aria-labelledby={HEADING_ID}
      className="py-10 md:py-16"
    >
      <Container width="prose" className="flex flex-col gap-6">
        <h2
          id={HEADING_ID}
          className="text-2xl font-semibold tracking-tight text-dc-text md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Or just email.
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {CHANNELS.map((channel) => (
            <a
              key={channel.href}
              href={channel.href}
              target={channel.external ? "_blank" : undefined}
              rel={channel.external ? "noopener noreferrer" : undefined}
              className="group flex flex-col gap-3 rounded-xl border border-dc-edge bg-dc-surface p-6 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-dc-edge-2 hover:shadow-[0_12px_32px_rgba(15,17,23,0.08)] dark:hover:shadow-none"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] text-[var(--color-brand)]"
              >
                {channel.icon}
              </span>
              <h3
                className="text-lg font-semibold text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {channel.title}
              </h3>
              <p className="text-sm leading-relaxed text-dc-text-2">
                {channel.blurb}
              </p>
              <span
                className="mt-auto inline-block text-sm font-semibold text-[var(--color-brand)] group-hover:underline"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {channel.cta}
              </span>
            </a>
          ))}
        </div>
      </Container>
    </MotionSection>
  );
}

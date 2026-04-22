// v1.0.0
// Marketing footer. Four columns on desktop, stacks on mobile. Teal anchor
// bar at the top. Company wordmark in Chakra Petch. <footer> landmark.

import Link from "next/link";
import { Linkedin, Mail } from "lucide-react";

import { Container } from "@/components/marketing/Container";

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/how-it-works" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const CONNECT_LINKS: FooterLink[] = [
  { label: "rob@opsfluency.com", href: "mailto:rob@opsfluency.com", external: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/opsfluency", external: true },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-dc-edge bg-dc-bg">
      <div
        aria-hidden="true"
        className="h-1 w-full bg-[var(--color-brand)]"
      />
      <Container as="div" className="py-12 md:py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2"
              aria-label="OpsFluency home"
            >
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full bg-[var(--color-signal-live)] animate-calm-pulse"
              />
              <span
                className="text-lg font-bold tracking-tight text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                OpsFluency
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-dc-text-2 leading-relaxed">
              Frontline knowledge and engagement for multilingual warehouse and manufacturing teams.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h2
                className="text-xs font-semibold uppercase tracking-widest text-dc-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-dc-text-2 hover:text-dc-text transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2
              className="text-xs font-semibold uppercase tracking-widest text-dc-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Connect
            </h2>
            <ul className="mt-4 space-y-3">
              {CONNECT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-2 text-sm text-dc-text-2 hover:text-dc-text transition-colors"
                  >
                    {link.href.startsWith("mailto:") ? (
                      <Mail className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <Linkedin className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    )}
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-dc-edge pt-6 text-xs text-dc-text-3 md:flex-row md:items-center">
          <p>
            &copy; {year} OpsFluency. All rights reserved.
          </p>
          <p
            className="font-mono"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Built by Rob. 20 years of operations leadership.
          </p>
        </div>
      </Container>
    </footer>
  );
}

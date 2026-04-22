// v1.0.0
// Contact hero. Narrow container, centered, no visual, no CTAs. The
// form below is the CTA.

import { Hero } from "@/components/marketing/Hero";

export function ContactHero() {
  return (
    <Hero
      ariaLabel="Contact"
      eyebrow="Contact"
      headline="Talk to Rob."
      subhead="No SDR. No qualification form. A direct line to the person who built it."
    />
  );
}

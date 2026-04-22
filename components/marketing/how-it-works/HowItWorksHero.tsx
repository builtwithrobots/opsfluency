// v1.0.0
// How It Works hero. Narrow hero per the page override.

import { Hero } from "@/components/marketing/Hero";

export function HowItWorksHero() {
  return (
    <Hero
      ariaLabel="How it works"
      eyebrow="How it works"
      headline="Fifteen minutes per SOP. Three taps for a worker to read it."
      subhead="Two roles. Two clean flows. The manager uploads a doc, defines the terms the AI flagged, approves the Spanish, and prints a QR. The worker taps a magic link, scans the QR, and reads. That is the whole product."
    />
  );
}

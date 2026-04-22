// v1.0.0
// Features hero. Narrow container, centered, no .background grid per
// the features override.

import { Hero } from "@/components/marketing/Hero";

export function FeaturesHero() {
  return (
    <Hero
      ariaLabel="Features"
      eyebrow="Features"
      headline="Everything a frontline team needs, nothing a procurement committee does."
      subhead="OpsFluency is built for the manager who needs results next shift, not after a six-month rollout. Every feature below was drawn from a real warehouse problem, not a pitch deck."
    />
  );
}

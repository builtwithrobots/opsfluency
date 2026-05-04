// v1.0.0
// Home hero. Wraps Hero in the .background grid utility from globals.css
// (Home is the only page that uses it). Eyebrow carries a leading
// animate-heartbeat live dot.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { Hero } from "@/components/marketing/Hero";

export function HomeHero() {
  return (
    <div className="background">
      <Hero
        ariaLabel="OpsFluency hero"
        eyebrow={
          <>
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-signal-live)] animate-heartbeat"
            />
            Bilingual SOPs. QR-triggered learning.
          </>
        }
        headline="Your frontline workers confident and competent from Day 1."
        subhead="Regardless of what language they speak. Live in 24 hours, no hardware required, $149 per month."
        primary={
          <Button
            href="/sign-up"
            size="lg"
            trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
          >
            Start free trial
          </Button>
        }
        secondary={
          <Button href="/how-it-works" variant="secondary" size="lg">
            See how it works
          </Button>
        }
      />
    </div>
  );
}

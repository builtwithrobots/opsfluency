// v1.0.0
// Home final CTA. CTABlock with two buttons: start free trial, talk to
// Rob. CTABlock already applies the teal gradient and section-loose
// rhythm.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { CTABlock } from "@/components/marketing/CTABlock";

export function HomeFinalCTA() {
  return (
    <CTABlock
      ariaLabel="Start free trial or contact Rob"
      heading="Ready to stop re-explaining procedures?"
      subhead="Set up your first bilingual SOP in 15 minutes. 14-day free trial. No credit card."
      primary={
        <Button
          href="/sign-up"
          size="lg"
          className="bg-white text-[var(--color-brand-dim)] hover:bg-white/90"
          trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
        >
          Start free trial
        </Button>
      }
      secondary={
        <Button
          href="/contact"
          variant="secondary"
          size="lg"
          className="border-white/40 text-white hover:bg-white/10 hover:border-white/60"
        >
          Talk to Rob
        </Button>
      }
    />
  );
}

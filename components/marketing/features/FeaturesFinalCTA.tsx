// v1.0.0
// Features page final CTA. Sends people to /pricing per the features
// override.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { CTABlock } from "@/components/marketing/CTABlock";

export function FeaturesFinalCTA() {
  return (
    <CTABlock
      ariaLabel="See pricing"
      heading="See what it costs to put all of this on your floor."
      subhead="Flat rate, no per-user fees. Most managers expense it without approval."
      primary={
        <Button
          href="/pricing"
          size="lg"
          className="bg-white text-[var(--color-brand-dim)] hover:bg-white/90"
          trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
        >
          See pricing
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

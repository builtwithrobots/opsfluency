// v1.0.0
// About page final CTA. Sends people to /contact per the About
// override.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { CTABlock } from "@/components/marketing/CTABlock";

export function AboutFinalCTA() {
  return (
    <CTABlock
      ariaLabel="Talk to Rob"
      heading="If this sounds like your operation, we should talk."
      subhead="No SDR. No qualification form. A direct line to the person who built it."
      primary={
        <Button
          href="/contact"
          size="lg"
          className="bg-white text-[var(--color-brand-dim)] hover:bg-white/90"
          trailingIcon={<ArrowRight className="h-4 w-4" strokeWidth={2} />}
        >
          Talk to Rob
        </Button>
      }
      secondary={
        <Button
          href="/sign-up"
          variant="secondary"
          size="lg"
          className="border-white/40 text-white hover:bg-white/10 hover:border-white/60"
        >
          Start a free trial
        </Button>
      }
    />
  );
}

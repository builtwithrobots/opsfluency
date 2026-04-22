// v1.0.0
// How It Works page final CTA.

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/marketing/Button";
import { CTABlock } from "@/components/marketing/CTABlock";

export function HowItWorksFinalCTA() {
  return (
    <CTABlock
      ariaLabel="Try the flow"
      heading="Run the flow yourself. Bring your worst PDF."
      subhead="Drop in a real SOP, watch the glossary catch what generic AI would mangle, and publish bilingual. All in the time it takes to boil pasta."
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

// v2.0.0
// Pricing page. Blueprint refresh: PricingHero left-aligned, new
// PricingConsultingSection (numeral "01") added before the platform
// billing context. Platform is numeral "02" in PricingTierGrid.

import type { Metadata } from "next";

import { BillingProvider } from "@/components/marketing/pricing/billing-context";
import { PricingBillingToggle } from "@/components/marketing/pricing/PricingBillingToggle";
import { PricingComparison } from "@/components/marketing/pricing/PricingComparison";
import { PricingConsultingSection } from "@/components/marketing/pricing/PricingConsultingSection";
import { PricingExpenseCallout } from "@/components/marketing/pricing/PricingExpenseCallout";
import { PricingFAQ } from "@/components/marketing/pricing/PricingFAQ";
import { PricingFinalCTA } from "@/components/marketing/pricing/PricingFinalCTA";
import { PricingHero } from "@/components/marketing/pricing/PricingHero";
import { PricingTierGrid } from "@/components/marketing/pricing/PricingTierGrid";

export const metadata: Metadata = {
  title: "OpsFluency pricing: flat rate, no per-user fees",
  description:
    "Four tiers from $79 a month. Flat rate, no per-user fees. Growth is expensable without committee approval. 14-day free trial, no credit card.",
  openGraph: {
    title: "OpsFluency pricing",
    description:
      "Starter $79. Growth $119. Scale $199. Enterprise custom. Flat rate, no per-user fees.",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingConsultingSection />
      <BillingProvider>
        <PricingBillingToggle />
        <PricingTierGrid />
        <PricingComparison />
      </BillingProvider>
      <PricingExpenseCallout />
      <PricingFAQ />
      <PricingFinalCTA />
    </>
  );
}

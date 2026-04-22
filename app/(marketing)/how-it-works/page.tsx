// v1.0.0
// How It Works page. Hero, two-column flow (manager + worker), tech
// stack grid, timeline, final CTA.

import type { Metadata } from "next";

import { HowItWorksFinalCTA } from "@/components/marketing/how-it-works/HowItWorksFinalCTA";
import { HowItWorksHero } from "@/components/marketing/how-it-works/HowItWorksHero";
import { HowItWorksTimeline } from "@/components/marketing/how-it-works/HowItWorksTimeline";
import { HowItWorksTwoColumn } from "@/components/marketing/how-it-works/HowItWorksTwoColumn";
import { HowItWorksUnderHood } from "@/components/marketing/how-it-works/HowItWorksUnderHood";

export const metadata: Metadata = {
  title: "How OpsFluency works: 15 minutes per SOP, 3 taps to read",
  description:
    "Manager and worker flows step by step. Upload, AI convert, translate, approve, print QR. Workers tap a magic link and scan. Under 15 minutes per SOP, end to end.",
  openGraph: {
    title: "How OpsFluency works",
    description:
      "Fifteen minutes per SOP. Three taps for a worker to read it. Both flows, step by step.",
    type: "website",
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <HowItWorksHero />
      <HowItWorksTwoColumn />
      <HowItWorksUnderHood />
      <HowItWorksTimeline />
      <HowItWorksFinalCTA />
    </>
  );
}

// v2.0.0
// About page. AboutRoadmap replaced with AboutHowIWork per site audit
// June 2026. Section order: Hero → FounderStory → Insight → Mission →
// HowIWork → FinalCTA.

import type { Metadata } from "next";

import { AboutFinalCTA } from "@/components/marketing/about/AboutFinalCTA";
import { AboutFounderStory } from "@/components/marketing/about/AboutFounderStory";
import { AboutHero } from "@/components/marketing/about/AboutHero";
import { AboutHowIWork } from "@/components/marketing/about/AboutHowIWork";
import { AboutInsight } from "@/components/marketing/about/AboutInsight";
import { AboutMission } from "@/components/marketing/about/AboutMission";

export const metadata: Metadata = {
  title: "About OpsFluency: built by an operator, for operators",
  description:
    "OpsFluency is operations infrastructure for multilingual warehouse and manufacturing teams. Twenty years of operations leadership behind it. Built to make every frontline worker competent from Day 1.",
  openGraph: {
    title: "About OpsFluency",
    description:
      "Built by an operator. Workers do not quit for fifty cents more per hour; they quit because they are frustrated and embarrassed.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutFounderStory />
      <AboutInsight />
      <AboutMission />
      <AboutHowIWork />
      <AboutFinalCTA />
    </>
  );
}

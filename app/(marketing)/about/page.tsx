// v1.0.0
// About page. Narrow prose-first layout per the About page override.
// Every section uses the `prose` (max-w-2xl) Container variant.

import type { Metadata } from "next";

import { AboutFinalCTA } from "@/components/marketing/about/AboutFinalCTA";
import { AboutFounderStory } from "@/components/marketing/about/AboutFounderStory";
import { AboutHero } from "@/components/marketing/about/AboutHero";
import { AboutInsight } from "@/components/marketing/about/AboutInsight";
import { AboutMission } from "@/components/marketing/about/AboutMission";
import { AboutRoadmap } from "@/components/marketing/about/AboutRoadmap";

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
      <AboutRoadmap />
      <AboutFinalCTA />
    </>
  );
}

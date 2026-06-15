// v2.0.0
// Tools page. Refactored into components per site audit June 2026.
// ToolsHero → ToolsPlatformCard → ToolsComingSoon → ToolsCTA.

import type { Metadata } from "next";

import { ToolsComingSoon } from "@/components/marketing/tools/ToolsComingSoon";
import { ToolsCTA } from "@/components/marketing/tools/ToolsCTA";
import { ToolsHero } from "@/components/marketing/tools/ToolsHero";
import { ToolsPlatformCard } from "@/components/marketing/tools/ToolsPlatformCard";

export const metadata: Metadata = {
  title: "Tools -- OpsFluency",
  description:
    "The tools Rob Ramos uses with every operations engagement. OpsFluency Platform: bilingual SOP delivery, QR codes at the machines, company glossary, and OSHA comprehension records. Flat rate per facility.",
};

export default function ToolsPage() {
  return (
    <>
      <ToolsHero />
      <ToolsPlatformCard />
      <ToolsComingSoon />
      <ToolsCTA />
    </>
  );
}

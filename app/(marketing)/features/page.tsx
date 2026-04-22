// v1.0.0
// Features page. Composes hero, nine feature detail sections, and the
// final CTA. Every section is its own component under
// components/marketing/features/.

import type { Metadata } from "next";

import { FeatureBilingualPublishing } from "@/components/marketing/features/FeatureBilingualPublishing";
import { FeatureGlossary } from "@/components/marketing/features/FeatureGlossary";
import { FeatureHRModule } from "@/components/marketing/features/FeatureHRModule";
import { FeatureManagerDashboard } from "@/components/marketing/features/FeatureManagerDashboard";
import { FeatureMonitors } from "@/components/marketing/features/FeatureMonitors";
import { FeatureQRCodes } from "@/components/marketing/features/FeatureQRCodes";
import { FeatureSOPImport } from "@/components/marketing/features/FeatureSOPImport";
import { FeatureScanAnalytics } from "@/components/marketing/features/FeatureScanAnalytics";
import { FeatureWorkerPWA } from "@/components/marketing/features/FeatureWorkerPWA";
import { FeaturesFinalCTA } from "@/components/marketing/features/FeaturesFinalCTA";
import { FeaturesHero } from "@/components/marketing/features/FeaturesHero";

export const metadata: Metadata = {
  title: "OpsFluency features: bilingual SOPs, QR, monitors, HR, analytics",
  description:
    "Nine features built for multilingual frontline teams. SOP import, glossary, bilingual publishing, QR codes, worker PWA, monitors, HR module, scan analytics, and manager dashboard.",
  openGraph: {
    title: "OpsFluency features",
    description:
      "Bilingual SOPs, QR-triggered learning, monitors, HR, and scan analytics in one system.",
    type: "website",
  },
};

export default function FeaturesPage() {
  return (
    <>
      <FeaturesHero />
      <FeatureSOPImport />
      <FeatureGlossary />
      <FeatureBilingualPublishing />
      <FeatureQRCodes />
      <FeatureWorkerPWA />
      <FeatureMonitors />
      <FeatureHRModule />
      <FeatureScanAnalytics />
      <FeatureManagerDashboard />
      <FeaturesFinalCTA />
    </>
  );
}

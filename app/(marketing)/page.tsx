// v3.0.0
// Consultancy homepage. New section order per site audit June 2026:
// Hero → CredibilityStrip → Problem → Services → Solution →
// HowItWorks → Founder → PricingTeaser → FinalCTA
// Signed-in users route away to their correct surface.

import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeFinalCTA } from "@/components/marketing/home/HomeFinalCTA";
import { HomeCredibilityStrip } from "@/components/marketing/home/HomeCredibilityStrip";
import { HomeFounder } from "@/components/marketing/home/HomeFounder";
import { HomeHero } from "@/components/marketing/home/HomeHero";
import { HomeHowItWorks } from "@/components/marketing/home/HomeHowItWorks";
import { HomeProblem } from "@/components/marketing/home/HomeProblem";
import { HomeServices } from "@/components/marketing/home/HomeServices";
import { getRequestClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title:
    "OpsFluency -- Operations Consulting, Fractional Leadership, and Bilingual SOP Platform",
  description:
    "20 years of warehouse and manufacturing operations leadership. Consulting, fractional ops leadership, and the OpsFluency bilingual SOP platform for multilingual frontline teams.",
  openGraph: {
    title: "OpsFluency -- Fix your operation. Train your team to own it.",
    description:
      "20 years of warehouse and manufacturing operations leadership. Consulting, fractional ops leadership, and the OpsFluency bilingual SOP platform for multilingual frontline teams.",
    type: "website",
  },
};

async function routeAuthedUserAway() {
  const { userId } = await auth();
  if (!userId) return;

  const supabase = await getRequestClient();

  const { data: isSuper } = await supabase.rpc("is_super_admin");
  if (isSuper) redirect("/dashboard/platform");

  const { data: member } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (member) redirect("/dashboard");
  redirect("/onboarding");
}

export default async function MarketingHome() {
  await routeAuthedUserAway();

  return (
    <>
      <HomeHero />
      <HomeCredibilityStrip />
      <HomeProblem />
      <HomeServices />
      <HomeHowItWorks />
      <HomeFounder />
      <HomeFinalCTA />
    </>
  );
}

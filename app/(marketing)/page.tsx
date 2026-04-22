// v1.1.0
// Marketing Home. Signed-in users route away to their correct surface.
// Signed-out users see the seven-section marketing page. Each section
// is its own component under components/marketing/home/.

import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeFinalCTA } from "@/components/marketing/home/HomeFinalCTA";
import { HomeFounder } from "@/components/marketing/home/HomeFounder";
import { HomeHero } from "@/components/marketing/home/HomeHero";
import { HomeHowItWorks } from "@/components/marketing/home/HomeHowItWorks";
import { HomePricingTeaser } from "@/components/marketing/home/HomePricingTeaser";
import { HomeProblem } from "@/components/marketing/home/HomeProblem";
import { HomeSolution } from "@/components/marketing/home/HomeSolution";
import { getRequestClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "OpsFluency: Make every frontline worker competent from Day 1",
  description:
    "Bilingual SOPs, QR-triggered learning, and departmental communication for multilingual warehouse and manufacturing teams. Live in 24 hours. No hardware required.",
  openGraph: {
    title: "OpsFluency: Make every frontline worker competent from Day 1",
    description:
      "Bilingual SOPs, QR-triggered learning, and departmental communication. Live in 24 hours. No hardware required.",
    type: "website",
  },
};

async function routeAuthedUserAway() {
  const { userId } = await auth();
  if (!userId) return;

  const supabase = await getRequestClient();

  const { data: isSuper } = await supabase.rpc("is_super_admin");
  if (isSuper) redirect("/dashboard/platform/tenants");

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
      <HomeProblem />
      <HomeSolution />
      <HomeHowItWorks />
      <HomePricingTeaser />
      <HomeFounder />
      <HomeFinalCTA />
    </>
  );
}

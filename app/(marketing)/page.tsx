// v2.1.0
// Consultancy homepage. Signed-in users route away to their correct surface.
// Section order: Hero → Services → Credibility → Problem → Tools → Final CTA.

import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeCredibility } from "@/components/marketing/home/HomeCredibility";
import { HomeFinalCTA } from "@/components/marketing/home/HomeFinalCTA";
import { HomeHero } from "@/components/marketing/home/HomeHero";
import { HomeProblem } from "@/components/marketing/home/HomeProblem";
import { HomeServices } from "@/components/marketing/home/HomeServices";
import { HomeTools } from "@/components/marketing/home/HomeTools";
import { getRequestClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "OpsFluency — Operations Consulting & Bilingual SOP Platform",
  description:
    "Rob Ramos has >20 years of warehouse and manufacturing operations experience. He helps bilingual facilities fix SOPs, reduce turnover, and meet OSHA, ISO 9001, and cGMP compliance requirements — and built the software to do it faster.",
  openGraph: {
    title: "Fluent in Your Floor.",
    description:
      "Rob Ramos has >20 years of warehouse and manufacturing operations experience. He helps bilingual facilities fix SOPs, reduce turnover, and meet OSHA, ISO 9001, and cGMP compliance requirements.",
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
      <HomeServices />
      <HomeCredibility />
      <HomeProblem />
      <HomeTools />
      <HomeFinalCTA />
    </>
  );
}

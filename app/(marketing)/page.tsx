// v1.0.0
// Marketing Home (placeholder). Signed-in users route directly to their
// correct surface. Signed-out users see the marketing site.
//
// Phase 2.3: minimal stub that exercises the nav, footer, theme toggle,
// and motion wiring so the plumbing can be verified on Vercel preview.
// Phase 3.1 replaces the content below with the seven section components
// described in design-system/opsfluency/pages/home.md.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { MotionSection } from "@/components/motion/MotionSection";
import { staggerContainer } from "@/lib/motion/variants";
import { getRequestClient } from "@/lib/supabase/server";

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
    <MotionSection
      aria-label="OpsFluency"
      variants={staggerContainer}
      className="background flex flex-1 flex-col items-center justify-center py-24 md:py-32"
    >
      <Container className="flex flex-col items-center gap-6 text-center">
        <MotionSection.Item>
          <span
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-signal-live)] animate-heartbeat"
            />
            Pre-launch
          </span>
        </MotionSection.Item>
        <MotionSection.Item>
          <h1
            className="max-w-3xl text-5xl font-bold tracking-tight text-dc-text md:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Make every frontline worker competent from Day 1.
          </h1>
        </MotionSection.Item>
        <MotionSection.Item>
          <p className="max-w-2xl text-lg leading-relaxed text-dc-text-2 md:text-xl">
            Bilingual SOPs, QR-triggered learning, and departmental communication in one manager-driven system. Live in 24 hours. No hardware required.
          </p>
        </MotionSection.Item>
        <MotionSection.Item className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button href="/sign-up" size="lg">
            Start free trial
          </Button>
          <Button href="/how-it-works" variant="secondary" size="lg">
            See how it works
          </Button>
        </MotionSection.Item>
      </Container>
    </MotionSection>
  );
}

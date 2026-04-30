import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, Bell, FileText, QrCode, ScanLine, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin-context";
import { getRequestClient } from "@/lib/supabase/server";

import { DashboardStatCard } from "@/components/dashboard/stat-card";
import { StatGridSkeleton } from "@/components/dashboard/stat-grid-skeleton";
import { EmptyActivityCard } from "@/components/dashboard/empty-activity-card";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";

interface DashboardPageProps {
  searchParams: Promise<{ welcome?: string }>;
}

async function DashboardStats({ company_id }: { company_id: string }) {
  const supabase = await getRequestClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: memberCount },
    { count: scanCount7d },
    { count: publishedSopCount },
    { count: liveQrCount },
  ] = await Promise.all([
    supabase
      .from("company_members")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id),
    supabase
      .from("qr_scans")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .gte("scanned_at", sevenDaysAgo),
    supabase
      .from("sops")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .eq("status", "published"),
    supabase
      .from("qr_codes")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .is("archived_at", null),
  ]);

  return (
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {/* Primary metrics — span 2 columns each */}
      <div className="col-span-2">
        <DashboardStatCard
          label="Published SOPs"
          value={publishedSopCount ?? 0}
          icon={<FileText className="size-5" strokeWidth={2} />}
          accent="brand"
          context="live procedures"
          delay={0}
          className="p-6"
        />
      </div>
      <div className="col-span-2">
        <DashboardStatCard
          label="QR scans"
          value={scanCount7d ?? 0}
          icon={<ScanLine className="size-5" strokeWidth={2} />}
          accent="brand"
          context="last 7 days"
          delay={0.05}
          className="p-6"
        />
      </div>
      {/* Secondary metrics — 1 column each */}
      <DashboardStatCard
        label="Live QR codes"
        value={liveQrCount ?? 0}
        icon={<QrCode className="size-5" strokeWidth={2} />}
        accent="neutral"
        context="never expire"
        delay={0.1}
      />
      <DashboardStatCard
        label="Team members"
        value={memberCount ?? 0}
        icon={<Users className="size-5" strokeWidth={2} />}
        accent="neutral"
        context="across all depts"
        delay={0.15}
      />
      <DashboardStatCard
        label="Pending approvals"
        value="—"
        icon={<Bell className="size-5" strokeWidth={2} />}
        accent="neutral"
        context="translations to review"
        delay={0.2}
      />
    </section>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  let ctx;
  try {
    ctx = await getCompanyContext();
  } catch (e) {
    // Super admins have no company_members row and therefore nothing
    // meaningful on the member-scoped home page. Route them to their
    // own landing.
    if (e instanceof AuthError && e.code === "NO_COMPANY") {
      if (await isCurrentUserSuperAdmin()) redirect("/dashboard/platform");
    }
    throw e;
  }

  const { supabase, company_id, role } = ctx;
  const { welcome } = await searchParams;
  const showWelcome = welcome === "1";

  const { data: company } = showWelcome
    ? await supabase.from("companies").select("name").eq("id", company_id).single()
    : { data: null };

  return (
    <div className="flex flex-col gap-8">
      {showWelcome ? <WelcomeBanner companyName={company?.name ?? "your workspace"} /> : null}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading>Command center</Heading>
          <Text className="mt-1.5 max-w-2xl">
            Publish SOPs, invite teammates, post announcements, and pair monitor screens.
          </Text>
        </div>
        {role !== "employee" && (
          <div className="flex gap-2">
            <Button href="/dashboard/import" color="brand">
              <FileText data-slot="icon" strokeWidth={2} />
              New SOP
            </Button>
            <Button href="/dashboard/employees" outline>
              <Users data-slot="icon" strokeWidth={2} />
              Invite teammate
            </Button>
          </div>
        )}
      </header>

      <Suspense fallback={<StatGridSkeleton />}>
        <DashboardStats company_id={company_id} />
      </Suspense>

      <div className="border-t border-[color:var(--dc-edge)]" />

      <OnboardingChecklist company_id={company_id} role={role} />

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <Subheading>Recent activity</Subheading>
            <Text className="mt-1">SOPs, scans, and announcements will appear here as modules land.</Text>
          </div>
          <Button plain href="/dashboard/sops">
            View SOPs
            <ArrowUpRight data-slot="icon" strokeWidth={2} />
          </Button>
        </div>

        <EmptyActivityCard />
      </section>
    </div>
  );
}

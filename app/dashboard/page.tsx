import { redirect } from "next/navigation";
import { ArrowUpRight, Bell, FileText, ScanLine, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin-context";

import { DashboardStatCard } from "@/components/dashboard/stat-card";
import { EmptyActivityCard } from "@/components/dashboard/empty-activity-card";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";

interface DashboardPageProps {
  searchParams: Promise<{ welcome?: string }>;
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
      if (await isCurrentUserSuperAdmin()) redirect("/dashboard/platform/tenants");
    }
    throw e;
  }

  const { supabase, company_id, role } = ctx;
  const { welcome } = await searchParams;
  const showWelcome = welcome === "1";

  const { data: company } = showWelcome
    ? await supabase.from("companies").select("name").eq("id", company_id).single()
    : { data: null };

  // Only company_members is live in the schema right now. Other counts will
  // light up as their tables land — see supabase/migrations/.
  const { count: memberCount } = await supabase
    .from("company_members")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company_id);

  return (
    <div className="flex flex-col gap-10">
      {showWelcome ? <WelcomeBanner companyName={company?.name ?? "your workspace"} /> : null}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            Overview
          </p>
          <Heading className="font-display mt-2">Command center</Heading>
          <Text className="mt-2 max-w-2xl">
            Everything running on the floor, in one place. Publish SOPs, invite
            teammates, post announcements, and pair monitor screens — the full
            {" "}OpsFluency stack lights up as each module lands.
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          label="Published SOPs"
          value="—"
          icon={<FileText className="size-5" strokeWidth={2} />}
          accent="brand"
          delay={0}
        />
        <DashboardStatCard
          label="Team members"
          value={memberCount ?? 0}
          icon={<Users className="size-5" strokeWidth={2} />}
          accent="signal-info"
          delay={0.05}
        />
        <DashboardStatCard
          label="QR scans (7d)"
          value="—"
          icon={<ScanLine className="size-5" strokeWidth={2} />}
          accent="signal-live"
          delay={0.1}
        />
        <DashboardStatCard
          label="Pending approvals"
          value="—"
          icon={<Bell className="size-5" strokeWidth={2} />}
          accent="signal-warn"
          delay={0.15}
        />
      </section>

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

import { DashboardTabs, type TabDef } from "@/components/dashboard/dashboard-tabs";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import { AdminsTab } from "./_tabs/admins-tab";
import { AiUsageTab } from "./_tabs/ai-usage-tab";
import { HealthTab } from "./_tabs/health-tab";
import { ImpersonationTab } from "./_tabs/impersonation-tab";
import { SeedTab } from "./_tabs/seed-tab";
import { TenantsTab } from "./_tabs/tenants-tab";

// Every /dashboard/platform route is already gated by the PlatformLayout
// (which calls getSuperAdminContext). This page is the tabbed entry
// point — the layout has already guaranteed super-admin access by the
// time this renders. Individual tabs can therefore re-use the request
// client without each re-verifying.

type TabId =
  | "ai"
  | "health"
  | "tenants"
  | "impersonation"
  | "seed"
  | "admins";

const VALID_TABS: readonly TabId[] = [
  "ai",
  "health",
  "tenants",
  "impersonation",
  "seed",
  "admins",
] as const;

function resolveTab(raw: string | undefined): TabId {
  return VALID_TABS.includes(raw as TabId) ? (raw as TabId) : "ai";
}

interface PageProps {
  searchParams: Promise<{ tab?: string; preset?: string; q?: string; days?: string; expand?: string }>;
}

export default async function PlatformPage({ searchParams }: PageProps) {
  const { tab: rawTab, days: rawDays, expand } = await searchParams;
  const tab = resolveTab(rawTab);
  const days = rawDays ? Math.max(1, parseInt(rawDays, 10) || 30) : 30;

  const tabs: TabDef[] = [
    { id: "ai",            label: "AI usage",        href: "/dashboard/platform?tab=ai" },
    { id: "health",        label: "Platform health", href: "/dashboard/platform?tab=health" },
    { id: "tenants",       label: "Tenants",         href: "/dashboard/platform?tab=tenants" },
    { id: "impersonation", label: "Impersonation",   href: "/dashboard/platform?tab=impersonation" },
    { id: "seed",          label: "Seed / demo",     href: "/dashboard/platform?tab=seed" },
    { id: "admins",        label: "Super admins",    href: "/dashboard/platform?tab=admins" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          Platform
        </p>
        <Heading className="font-display mt-2">Super admin console</Heading>
        <Text className="mt-2 max-w-2xl">
          Cross-tenant operations: browse every company, seed demo tenants,
          manage the super-admin roster, audit impersonation, and watch AI
          spend. Every destructive action here is audit-logged.
        </Text>
      </header>

      <DashboardTabs tabs={tabs} activeTab={tab} />

      {tab === "tenants" && <TenantsTab expandedId={expand} />}
      {tab === "seed" && <SeedTab />}
      {tab === "admins" && <AdminsTab />}
      {tab === "impersonation" && <ImpersonationTab />}
      {tab === "ai" && <AiUsageTab days={days} />}
      {tab === "health" && <HealthTab />}
    </div>
  );
}

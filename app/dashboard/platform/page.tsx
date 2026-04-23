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
  | "tenants"
  | "seed"
  | "admins"
  | "impersonation"
  | "ai"
  | "health";

const VALID_TABS: readonly TabId[] = [
  "tenants",
  "seed",
  "admins",
  "impersonation",
  "ai",
  "health",
] as const;

function resolveTab(raw: string | undefined): TabId {
  return VALID_TABS.includes(raw as TabId) ? (raw as TabId) : "tenants";
}

interface PageProps {
  searchParams: Promise<{ tab?: string; preset?: string; q?: string }>;
}

export default async function PlatformPage({ searchParams }: PageProps) {
  const { tab: rawTab } = await searchParams;
  const tab = resolveTab(rawTab);

  const tabs: TabDef[] = [
    { id: "tenants",       label: "Tenants",         href: "/dashboard/platform?tab=tenants" },
    { id: "seed",          label: "Seed / demo",     href: "/dashboard/platform?tab=seed" },
    { id: "admins",        label: "Super admins",    href: "/dashboard/platform?tab=admins" },
    { id: "impersonation", label: "Impersonation",   href: "/dashboard/platform?tab=impersonation" },
    { id: "ai",            label: "AI usage",        href: "/dashboard/platform?tab=ai" },
    { id: "health",        label: "Platform health", href: "/dashboard/platform?tab=health" },
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

      {tab === "tenants" && <TenantsTab />}
      {tab === "seed" && <SeedTab />}
      {tab === "admins" && <AdminsTab />}
      {tab === "impersonation" && <ImpersonationTab />}
      {tab === "ai" && <AiUsageTab />}
      {tab === "health" && <HealthTab />}
    </div>
  );
}

import { DashboardTabs, type TabDef } from "@/components/dashboard/dashboard-tabs";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import { BillingTab } from "./_tabs/billing-tab";
import { GeneralTab } from "./_tabs/general-tab";
import { TeamTab } from "./_tabs/team-tab";

type TabId = "general" | "team" | "billing";

const VALID_TABS: readonly TabId[] = ["general", "team", "billing"] as const;

function resolveTab(raw: string | undefined): TabId {
  return VALID_TABS.includes(raw as TabId) ? (raw as TabId) : "general";
}

interface PageProps {
  searchParams: Promise<{ tab?: string; saved?: string }>;
}

export default async function OrgSettingsPage({ searchParams }: PageProps) {
  const { tab: rawTab, saved } = await searchParams;
  const tab = resolveTab(rawTab);

  const tabs: TabDef[] = [
    { id: "general", label: "General",  href: "/dashboard/org-settings?tab=general" },
    { id: "team",    label: "Team",     href: "/dashboard/org-settings?tab=team" },
    { id: "billing", label: "Billing",  href: "/dashboard/org-settings?tab=billing" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Heading>Org Settings</Heading>
        <Text className="mt-1.5 max-w-2xl">
          Manage your company profile, team members, and subscription.
        </Text>
      </header>

      <DashboardTabs tabs={tabs} activeTab={tab} />

      {tab === "general" && <GeneralTab saved={saved === "1"} />}
      {tab === "team"    && <TeamTab />}
      {tab === "billing" && <BillingTab />}
    </div>
  );
}

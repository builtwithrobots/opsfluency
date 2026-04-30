import { DashboardTabs, type TabDef } from "@/components/dashboard/dashboard-tabs";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import { PreferencesTab } from "./_tabs/preferences-tab";
import { ProfileTab } from "./_tabs/profile-tab";
import { SecurityTab } from "./_tabs/security-tab";

type TabId = "profile" | "preferences" | "security";

const VALID_TABS: readonly TabId[] = ["profile", "preferences", "security"] as const;

function resolveTab(raw: string | undefined): TabId {
  return VALID_TABS.includes(raw as TabId) ? (raw as TabId) : "profile";
}

interface PageProps {
  searchParams: Promise<{ tab?: string; saved?: string }>;
}

export default async function MySettingsPage({ searchParams }: PageProps) {
  const { tab: rawTab, saved } = await searchParams;
  const tab = resolveTab(rawTab);

  const tabs: TabDef[] = [
    { id: "profile",     label: "Profile",     href: "/dashboard/my-settings?tab=profile" },
    { id: "preferences", label: "Preferences", href: "/dashboard/my-settings?tab=preferences" },
    { id: "security",    label: "Security",    href: "/dashboard/my-settings?tab=security" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Heading>My Settings</Heading>
        <Text className="mt-1.5 max-w-2xl">
          Manage your personal account, language preference, and sign-in
          options. Company-wide settings live in Org Settings.
        </Text>
      </header>

      <DashboardTabs tabs={tabs} activeTab={tab} />

      {tab === "profile"     && <ProfileTab />}
      {tab === "preferences" && <PreferencesTab saved={saved === "1"} />}
      {tab === "security"    && <SecurityTab />}
    </div>
  );
}

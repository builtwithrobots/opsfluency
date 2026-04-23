import { DashboardTabs, type TabDef } from "@/components/dashboard/dashboard-tabs";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import { DepartmentsTab } from "./_tabs/departments-tab";
import { MembersTab } from "./_tabs/members-tab";
import { SopsTab } from "./_tabs/sops-tab";

type TabId = "departments" | "members" | "sops";

const VALID_TABS: readonly TabId[] = ["departments", "members", "sops"] as const;

function resolveTab(raw: string | undefined): TabId {
  return VALID_TABS.includes(raw as TabId) ? (raw as TabId) : "departments";
}

interface PageProps {
  searchParams: Promise<{ tab?: string; dept?: string; editing?: string }>;
}

export default async function DepartmentsPage({ searchParams }: PageProps) {
  const { tab: rawTab, dept, editing } = await searchParams;
  const tab = resolveTab(rawTab);

  const tabs: TabDef[] = [
    { id: "departments", label: "Departments", href: "/dashboard/departments?tab=departments" },
    { id: "members",     label: "Members",     href: "/dashboard/departments?tab=members" },
    { id: "sops",        label: "SOPs",        href: "/dashboard/departments?tab=sops" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          Manager
        </p>
        <Heading className="font-display mt-2">Departments</Heading>
        <Text className="mt-2 max-w-2xl">
          Manage your company&apos;s departments, assign team members, and view
          associated SOPs.
        </Text>
      </header>

      <DashboardTabs tabs={tabs} activeTab={tab} />

      {tab === "departments" && <DepartmentsTab editing={editing} />}
      {tab === "members"     && <MembersTab selectedDeptId={dept} />}
      {tab === "sops"        && <SopsTab />}
    </div>
  );
}

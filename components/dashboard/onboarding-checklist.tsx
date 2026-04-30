// Server component that fetches counts, passes to client for dismiss logic.
// Only shown to admin/manager roles (not employees).

import type { Role } from "@/lib/auth/company-context";
import { getRequestClient } from "@/lib/supabase/server";

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href: string | null;
  actionLabel: string | null;
}

interface Props {
  company_id: string;
  role: Role;
}

export async function OnboardingChecklist({ company_id, role }: Props) {
  if (role === "employee") return null;

  const supabase = await getRequestClient();

  const [sopResult, memberResult, companyResult] = await Promise.all([
    supabase
      .from("sops")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id),
    supabase
      .from("company_members")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id),
    supabase
      .from("companies")
      .select("logo_url, address_line1")
      .eq("id", company_id)
      .single(),
  ]);

  const hasSop = (sopResult.count ?? 0) > 0;
  const hasTeammate = (memberResult.count ?? 0) > 1;
  const company = companyResult.data;
  const isCompanyComplete = Boolean(company?.logo_url && company?.address_line1);

  const items: ChecklistItem[] = [
    {
      id: "company",
      label: "Complete your company profile",
      done: isCompanyComplete,
      href: "/dashboard/org-settings?tab=general",
      actionLabel: "Complete profile",
    },
    {
      id: "sop",
      label: "Import your first SOP",
      done: hasSop,
      href: "/dashboard/sops",
      actionLabel: "Import SOP",
    },
    {
      id: "invite",
      label: "Invite a teammate",
      done: hasTeammate,
      href: "/dashboard/org-settings?tab=team",
      actionLabel: "Invite now",
    },
  ];

  // Once all tasks are complete there's nothing to show.
  if (items.every((i) => i.done)) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <OnboardingChecklistClient
      items={items}
      company_id={company_id}
      doneCount={doneCount}
    />
  );
}

// ── Client component — handles localStorage dismiss ──────────────────────────

import { ChecklistClientWrapper } from "./onboarding-checklist-client";

function OnboardingChecklistClient({
  items,
  company_id,
  doneCount,
}: {
  items: ChecklistItem[];
  company_id: string;
  doneCount: number;
}) {
  return (
    <ChecklistClientWrapper
      items={items}
      company_id={company_id}
      doneCount={doneCount}
    />
  );
}

export type { ChecklistItem };

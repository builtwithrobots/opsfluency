import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContextOrPlatform } from "@/lib/auth/redirect-helpers";
import { getCreatorScope } from "@/lib/qr/creator-scope";
import type { AnnouncementWithMeta } from "@/lib/types/announcements";

import { AnnouncementsManager } from "./_components/AnnouncementsManager";

export const metadata = {
  title: "Announcements · OpsFluency",
};

export default async function AnnouncementsPage() {
  const { userId, supabase, company_id, role, impersonating } =
    await getCompanyContextOrPlatform("manager");

  const scope = await getCreatorScope({
    supabase,
    userId,
    company_id,
    role,
    impersonating,
  });

  // Fetch all departments in the company for the create form selector
  const { data: allDepts } = await supabase
    .from("departments")
    .select("id, name")
    .eq("company_id", company_id)
    .order("name", { ascending: true });

  // Restrict to manager's own departments unless they have unrestricted scope
  const departments = (allDepts ?? []).filter(
    (d) =>
      scope.unrestricted || scope.allowed_department_ids.includes(d.id),
  );

  // Fetch all announcements for this company (manager/admin sees all they created + org-wide)
  // Admins and unrestricted managers see everything; others see own + org-wide
  let announcementsQuery = supabase
    .from("announcements")
    .select("*, departments(name)")
    .eq("company_id", company_id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (!scope.unrestricted) {
    // Regular managers see their own posts and org-wide posts only
    const deptIdList = scope.allowed_department_ids.join(",");
    const filter = deptIdList.length > 0
      ? `created_by.eq.${userId},department_id.is.null,department_id.in.(${deptIdList})`
      : `created_by.eq.${userId},department_id.is.null`;
    announcementsQuery = announcementsQuery.or(filter);
  }

  const { data: rawAnnouncements } = await announcementsQuery;

  const announcements: AnnouncementWithMeta[] = (rawAnnouncements ?? []).map(
    (a) => ({
      ...a,
      department_name:
        (a.departments as { name: string } | null)?.name ?? null,
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Heading>Announcements</Heading>
        <Text className="mt-1.5 max-w-2xl">
          Post messages to your team. Spanish translations are generated
          automatically using your company glossary.
        </Text>
      </header>

      <AnnouncementsManager
        initialAnnouncements={announcements}
        departments={departments}
        canPostOrgWide={scope.unrestricted}
      />
    </div>
  );
}

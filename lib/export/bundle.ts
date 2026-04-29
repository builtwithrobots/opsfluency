import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AnnouncementExport,
  CompanyExport,
  DepartmentExport,
  GlossaryTermExport,
  OrgExportBundle,
  QrCodeExport,
  SopExport,
  SopVersionExport,
  TagExport,
  TeamInviteExport,
  TeamMemberExport,
} from "@/lib/types/export";

// Assembles the full org export bundle using the RLS-enforced Supabase client
// received from getCompanyContext. Because the client carries the Clerk JWT,
// every query is automatically company-scoped by RLS — cross-tenant leakage
// is impossible at the database layer even if company_id were wrong.
// The explicit .eq('company_id', ...) calls are defense-in-depth and ensure
// Postgres uses the compound index.
//
// Sensitive fields intentionally excluded:
//   - original_file_url (Supabase storage URLs, may expire)
//   - print_config (internal UI rendering preference)
//   - qr_scans (ip_hash is PII-adjacent; analytics only)
//   - team_invites.token (live auth secret)
//   - Team member emails (live in Clerk, not Supabase — see _meta.pii_note)
export async function assembleOrgBundle(
  supabase: SupabaseClient,
  company_id: string,
): Promise<OrgExportBundle> {
  const [
    companyResult,
    departmentsResult,
    sopsResult,
    sopVersionsResult,
    glossaryResult,
    tagsResult,
    announcementsResult,
    qrCodesResult,
    membersResult,
    employeeDeptsResult,
    glossaryTagsResult,
    sopTagsResult,
    teamInvitesResult,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "id, name, phone, logo_url, address_line1, address_line2, city, state, zip, default_sop_template, created_at",
      )
      .eq("id", company_id)
      .single(),

    supabase
      .from("departments")
      .select("id, name, color_key, icon_key, created_at")
      .eq("company_id", company_id)
      .order("name"),

    supabase
      .from("sops")
      .select(
        "id, title, status, template, department_id, created_by, created_at, updated_at, archived_at",
      )
      .eq("company_id", company_id)
      .order("created_at"),

    supabase
      .from("sop_versions")
      .select(
        "id, sop_id, version_number, content_en, content_es, needs_retranslation, flagged_terms, published_at, created_at",
      )
      .eq("company_id", company_id)
      .order("sop_id")
      .order("version_number"),

    supabase
      .from("glossary_terms")
      .select(
        "id, term_en, definition_en, term_es, definition_es, created_by, created_at, updated_at, deleted_at",
      )
      .eq("company_id", company_id)
      .order("term_en"),

    supabase
      .from("tags")
      .select("id, name_en, name_es, color, source, department_id, created_at")
      .eq("company_id", company_id)
      .order("name_en"),

    supabase
      .from("announcements")
      .select(
        "id, department_id, created_by, title_en, title_es, body_en, body_es, priority, pinned, expires_at, link_url, created_at",
      )
      .eq("company_id", company_id)
      .order("created_at"),

    supabase
      .from("qr_codes")
      .select(
        "id, target_type, target_id, target_url, label, audience_department_ids, audience_roles, created_by, created_at",
      )
      .eq("company_id", company_id)
      .order("created_at"),

    supabase
      .from("company_members")
      .select(
        "id, clerk_user_id, role, preferred_language, is_owner, invited_at, joined_at, locked_at",
      )
      .eq("company_id", company_id)
      .order("joined_at"),

    supabase
      .from("employee_departments")
      .select("member_id, department_id")
      .eq("company_id", company_id),

    supabase.from("glossary_term_tags").select("term_id, tag_id"),

    supabase.from("sop_tags").select("sop_id, tag_id"),

    supabase
      .from("team_invites")
      .select("id, email, name, role, invited_by, invited_at, claimed_at")
      .eq("company_id", company_id)
      .order("invited_at"),
  ]);

  // Build join-table lookup maps
  const memberDepts: Record<string, string[]> = {};
  for (const row of employeeDeptsResult.data ?? []) {
    (memberDepts[row.member_id] ??= []).push(row.department_id);
  }

  const glossaryTagMap: Record<string, string[]> = {};
  for (const row of glossaryTagsResult.data ?? []) {
    (glossaryTagMap[row.term_id] ??= []).push(row.tag_id);
  }

  const sopTagMap: Record<string, string[]> = {};
  for (const row of sopTagsResult.data ?? []) {
    (sopTagMap[row.sop_id] ??= []).push(row.tag_id);
  }

  const sops: SopExport[] = (sopsResult.data ?? []).map((s) => ({
    ...(s as Omit<SopExport, "tags">),
    tags: sopTagMap[s.id] ?? [],
  }));

  const glossary_terms: GlossaryTermExport[] = (
    glossaryResult.data ?? []
  ).map((t) => ({
    ...(t as Omit<GlossaryTermExport, "tags">),
    tags: glossaryTagMap[t.id] ?? [],
  }));

  const team_members: TeamMemberExport[] = (membersResult.data ?? []).map(
    (m) => ({
      ...(m as Omit<TeamMemberExport, "department_ids">),
      department_ids: memberDepts[m.id] ?? [],
    }),
  );

  return {
    exported_at: new Date().toISOString(),
    company: companyResult.data as CompanyExport,
    departments: (departmentsResult.data ?? []) as DepartmentExport[],
    sops,
    sop_versions: (sopVersionsResult.data ?? []) as SopVersionExport[],
    glossary_terms,
    tags: (tagsResult.data ?? []) as TagExport[],
    announcements: (announcementsResult.data ?? []) as AnnouncementExport[],
    qr_codes: (qrCodesResult.data ?? []) as QrCodeExport[],
    team_members,
    team_invites: (teamInvitesResult.data ?? []) as TeamInviteExport[],
    _meta: {
      format_version: 1,
      pii_note:
        "Team member email addresses are managed by Clerk (the identity provider) and are not stored in OpsFluency's database. The clerk_user_id field can be used to correlate records with a Clerk export. Contact support@opsfluency.com for a combined export that includes email addresses.",
      excluded_tables: [
        "qr_scans — analytics-only; ip_hash values are pseudonymous and not useful outside the system",
        "team_invites.token — live authentication secrets, never exported",
        "sop_versions.original_file_url — Supabase storage URLs that may expire",
        "qr_codes.print_config — internal UI rendering preferences",
      ],
    },
  };
}

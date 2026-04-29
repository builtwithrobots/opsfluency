export const EXPORT_FORMATS = [
  "json",
  "csv_sops",
  "csv_glossary",
  "csv_team",
  "xlsx",
] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const CSV_ENTITIES = ["sops", "glossary", "team"] as const;
export type CsvEntity = (typeof CSV_ENTITIES)[number];

export interface OrgExportBundle {
  exported_at: string;
  company: CompanyExport;
  departments: DepartmentExport[];
  sops: SopExport[];
  sop_versions: SopVersionExport[];
  glossary_terms: GlossaryTermExport[];
  tags: TagExport[];
  announcements: AnnouncementExport[];
  qr_codes: QrCodeExport[];
  team_members: TeamMemberExport[];
  team_invites: TeamInviteExport[];
  _meta: ExportMeta;
}

export interface ExportMeta {
  format_version: 1;
  pii_note: string;
  excluded_tables: string[];
}

export interface CompanyExport {
  id: string;
  name: string;
  phone: string | null;
  logo_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  default_sop_template: string | null;
  created_at: string;
}

export interface DepartmentExport {
  id: string;
  name: string;
  color_key: string | null;
  icon_key: string | null;
  created_at: string;
}

export interface SopExport {
  id: string;
  title: string;
  status: string;
  template: string | null;
  department_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  tags: string[];
}

export interface SopVersionExport {
  id: string;
  sop_id: string;
  version_number: number;
  content_en: string | null;
  content_es: string | null;
  needs_retranslation: boolean;
  flagged_terms: unknown | null;
  published_at: string | null;
  created_at: string;
}

export interface GlossaryTermExport {
  id: string;
  term_en: string;
  definition_en: string | null;
  term_es: string;
  definition_es: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tags: string[];
}

export interface TagExport {
  id: string;
  name_en: string;
  name_es: string;
  color: string;
  source: string;
  department_id: string | null;
  created_at: string;
}

export interface AnnouncementExport {
  id: string;
  department_id: string | null;
  created_by: string;
  title_en: string;
  title_es: string;
  body_en: string;
  body_es: string;
  priority: string;
  pinned: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface QrCodeExport {
  id: string;
  target_type: string;
  target_id: string | null;
  target_url: string | null;
  label: string;
  audience_department_ids: string[];
  audience_roles: string[];
  created_by: string;
  created_at: string;
}

export interface TeamMemberExport {
  id: string;
  clerk_user_id: string;
  role: string;
  preferred_language: string | null;
  is_owner: boolean;
  invited_at: string | null;
  joined_at: string | null;
  locked_at: string | null;
  department_ids: string[];
  // Email is stored in Clerk, not Supabase. See _meta.pii_note in OrgExportBundle.
}

export interface TeamInviteExport {
  id: string;
  email: string;
  name: string | null;
  role: string;
  invited_by: string;
  invited_at: string;
  claimed_at: string | null;
  // token excluded — live auth secret, never export
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: string;
}

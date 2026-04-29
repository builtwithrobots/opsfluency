import "server-only";

import * as XLSX from "xlsx";

import type {
  GlossaryTermExport,
  OrgExportBundle,
  SopExport,
  TeamMemberExport,
} from "@/lib/types/export";

// RFC 4180 CSV serializer. No external dependency needed.
// Values with commas, quotes, or newlines are wrapped in double-quotes;
// embedded quotes are escaped as "". Arrays are pipe-joined before escaping.
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = Array.isArray(value) ? value.join("|") : String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];
  return lines.join("\r\n");
}

export function buildSopsCsv(sops: SopExport[]): string {
  const headers = [
    "id",
    "title",
    "status",
    "template",
    "department_id",
    "created_by",
    "created_at",
    "updated_at",
    "archived_at",
    "tag_ids",
  ];
  const rows = sops.map((s) => [
    s.id,
    s.title,
    s.status,
    s.template,
    s.department_id,
    s.created_by,
    s.created_at,
    s.updated_at,
    s.archived_at,
    s.tags,
  ]);
  return buildCsv(headers, rows);
}

export function buildGlossaryCsv(terms: GlossaryTermExport[]): string {
  const headers = [
    "id",
    "term_en",
    "definition_en",
    "term_es",
    "definition_es",
    "created_by",
    "created_at",
    "updated_at",
    "deleted_at",
    "tag_ids",
  ];
  const rows = terms.map((t) => [
    t.id,
    t.term_en,
    t.definition_en,
    t.term_es,
    t.definition_es,
    t.created_by,
    t.created_at,
    t.updated_at,
    t.deleted_at,
    t.tags,
  ]);
  return buildCsv(headers, rows);
}

export function buildTeamCsv(members: TeamMemberExport[]): string {
  const headers = [
    "id",
    "clerk_user_id",
    "role",
    "is_owner",
    "preferred_language",
    "invited_at",
    "joined_at",
    "locked_at",
    "department_ids",
    "email_note",
  ];
  const rows = members.map((m) => [
    m.id,
    m.clerk_user_id,
    m.role,
    m.is_owner,
    m.preferred_language,
    m.invited_at,
    m.joined_at,
    m.locked_at,
    m.department_ids,
    "Email address stored in Clerk - not available here",
  ]);
  return buildCsv(headers, rows);
}

// ── XLSX multi-sheet workbook ────────────────────────────────────────────────
//
// Builds a single .xlsx file with one sheet per entity from the full org bundle.
// Arrays (tag_ids, department_ids) are pipe-joined to keep cells readable.
// Returns a Buffer so the API route can stream it directly as a binary response.

function toRows(headers: string[], data: unknown[][]): unknown[][] {
  return [headers, ...data];
}

function normalizeCell(v: unknown): unknown {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join("|");
  return v;
}

function sheetFromRows(headers: string[], rows: unknown[][]): XLSX.WorkSheet {
  const normalized = rows.map((r) => r.map(normalizeCell));
  return XLSX.utils.aoa_to_sheet(toRows(headers, normalized));
}

export function buildXlsx(bundle: OrgExportBundle): Buffer {
  const wb = XLSX.utils.book_new();

  // SOPs sheet
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      ["id", "title", "status", "template", "department_id", "created_by", "created_at", "updated_at", "archived_at", "tag_ids"],
      bundle.sops.map((s) => [s.id, s.title, s.status, s.template, s.department_id, s.created_by, s.created_at, s.updated_at, s.archived_at, s.tags]),
    ),
    "SOPs",
  );

  // Glossary sheet
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      ["id", "term_en", "definition_en", "term_es", "definition_es", "created_by", "created_at", "updated_at", "deleted_at", "tag_ids"],
      bundle.glossary_terms.map((t) => [t.id, t.term_en, t.definition_en, t.term_es, t.definition_es, t.created_by, t.created_at, t.updated_at, t.deleted_at, t.tags]),
    ),
    "Glossary",
  );

  // Team sheet
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      ["id", "clerk_user_id", "role", "is_owner", "preferred_language", "invited_at", "joined_at", "locked_at", "department_ids", "email_note"],
      bundle.team_members.map((m) => [m.id, m.clerk_user_id, m.role, m.is_owner, m.preferred_language, m.invited_at, m.joined_at, m.locked_at, m.department_ids, "Email stored in Clerk - not available here"]),
    ),
    "Team",
  );

  // Departments sheet
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      ["id", "name", "color_key", "icon_key", "created_at"],
      bundle.departments.map((d) => [d.id, d.name, d.color_key, d.icon_key, d.created_at]),
    ),
    "Departments",
  );

  // Announcements sheet
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      ["id", "department_id", "created_by", "title_en", "title_es", "body_en", "body_es", "priority", "pinned", "expires_at", "created_at"],
      bundle.announcements.map((a) => [a.id, a.department_id, a.created_by, a.title_en, a.title_es, a.body_en, a.body_es, a.priority, a.pinned, a.expires_at, a.created_at]),
    ),
    "Announcements",
  );

  // QR Codes sheet
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      ["id", "label", "target_type", "target_id", "target_url", "audience_department_ids", "audience_roles", "created_by", "created_at"],
      bundle.qr_codes.map((q) => [q.id, q.label, q.target_type, q.target_id, q.target_url, q.audience_department_ids, q.audience_roles, q.created_by, q.created_at]),
    ),
    "QR Codes",
  );

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

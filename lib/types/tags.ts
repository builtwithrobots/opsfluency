/**
 * Shared company tag vocabulary. Tags are bilingual labels that managers
 * attach to both glossary terms and SOPs. The `source` field distinguishes
 * auto-seeded department tags (cannot be deleted) from manager-created
 * custom tags.
 *
 * Schema: `tags`, `glossary_term_tags`, `sop_tags`
 * Migration: 20260427000003_tags.sql
 */

export interface Tag {
  id: string;
  company_id: string;
  name_en: string;
  name_es: string;
  color: string;
  source: "department" | "custom";
  department_id: string | null;
  created_by: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface TagWithUsage extends Tag {
  sop_count: number;
  term_count: number;
}

export const TAG_NAME_MAX = 60;

export const TAG_COLORS = [
  "#6b7280",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

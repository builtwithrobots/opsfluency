/**
 * Glossary term shapes shared across AI injection, translation, and the
 * manager-facing dashboard. The schema is `glossary_terms` —
 * see `supabase/migrations/...sop_simplification.sql` and the soft-delete
 * follow-on migration.
 *
 * Three shapes:
 *
 * - `GlossaryRow` is the minimal projection passed into Sonnet system
 *   prompts and Google Translate placeholder substitution. AI callers do
 *   not need ids, timestamps, or audit fields.
 * - `GlossaryTerm` is the full row used by the management UI (list,
 *   create, update, archive, restore). `deleted_at` distinguishes
 *   active from archived; the canonical reads filter `deleted_at IS NULL`.
 * - `GlossaryTermWithTags` extends `GlossaryTerm` with the term's
 *   associated tags (joined from `glossary_term_tags` + `tags`).
 */

export interface GlossaryRow {
  term_en: string;
  definition_en: string | null;
  term_es: string;
  definition_es: string | null;
}

export interface GlossaryTerm extends GlossaryRow {
  id: string;
  company_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const GLOSSARY_TERM_MAX = 200;
export const GLOSSARY_DEFINITION_MAX = 2000;

import type { Tag } from "./tags";

export interface GlossaryTermWithTags extends GlossaryTerm {
  tags: Tag[];
}

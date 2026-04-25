-- OpsFluency — soft delete for glossary_terms.
--
-- The glossary is the only table whose rows encode bilingual *decisions*
-- rather than operational state. A hard delete loses that decision
-- silently: future re-translations of any SOP after the delete produce
-- different Spanish than the SOPs translated before it, eroding the
-- terminology consistency that's the core of the product. Soft delete
-- preserves the EN/ES pair, lets a manager restore in one click, and
-- keeps `glossary_terms` out of every Sonnet / Google call by filtering
-- `deleted_at IS NULL` at every read site.
--
-- The unique constraint must move from "all rows" to "active rows only".
-- Otherwise a manager who archives a term can never re-define it (the
-- archived row blocks the new spelling), which turns archive into a
-- trap. We replace the table-level UNIQUE and the case-insensitive
-- unique index with partial indexes scoped to `deleted_at is null`.

begin;

alter table glossary_terms
  add column if not exists deleted_at timestamptz;

-- Drop the table-level UNIQUE (company_id, term_en) constraint and the
-- case-insensitive index from migration 20260425000001. Both are being
-- replaced with partial-unique variants so archived rows can coexist
-- with their successors.
alter table glossary_terms
  drop constraint if exists glossary_terms_company_id_term_en_key;

drop index if exists glossary_terms_company_term_lower_idx;

-- Active EN term must be unique per company, case-insensitive. Archived
-- rows are excluded — restore-time collisions are rejected by the
-- partial unique constraint and surfaced to the manager as a typed
-- error from the Server Action.
create unique index if not exists glossary_terms_active_company_term_lower_idx
  on glossary_terms (company_id, lower(term_en))
  where deleted_at is null;

-- Read paths (Sonnet injection, Google placeholder map, manager list)
-- always filter deleted_at IS NULL. A partial index on
-- (company_id) WHERE deleted_at IS NULL keeps those reads index-only
-- without the planner pulling archived rows.
create index if not exists glossary_terms_active_company_id_idx
  on glossary_terms (company_id)
  where deleted_at is null;

commit;

-- Add created_by (Clerk user id) and archived_at to tags.
-- created_by: audit trail + ownership display in the Labels manager.
-- archived_at: soft-delete — hides tag from the picker without removing
--              existing sop_tags / glossary_term_tags assignments.

ALTER TABLE public.tags
  ADD COLUMN IF NOT EXISTS created_by    TEXT,
  ADD COLUMN IF NOT EXISTS archived_at   TIMESTAMPTZ;

-- Index for the Labels tab query (active tags filter).
CREATE INDEX IF NOT EXISTS tags_archived_at_idx
  ON public.tags (company_id, archived_at)
  WHERE archived_at IS NULL;

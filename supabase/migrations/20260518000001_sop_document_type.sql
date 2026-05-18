-- Flexible document upload — phase 1 (soft generalization).
--
-- The pipeline (status lifecycle, versioning, bilingual storage, glossary
-- flagging, translation, QR codes) is already document-agnostic; only the
-- UI labels, AI prompt wording, and table names are SOP-specific. This
-- migration adds the discriminator column so any document type can flow
-- through the existing pipeline. Tables stay named `sops` / `sop_versions`
-- for now — renaming is a separate Phase 2 migration coordinated with the
-- route rename and qr_codes.target_type migration.
--
-- Document types:
--   sop        — procedures, the original (default for existing rows)
--   policy     — HR handbooks, codes of conduct, written expectations
--   training   — onboarding decks, equipment certification, skill-up guides
--   reference  — equipment specs, contact lists, lookup material
--   notice    — time-bound communications (safety alerts, schedule changes)

ALTER TABLE sops
  ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'sop'
  CHECK (document_type IN ('sop', 'policy', 'training', 'reference', 'notice'));

COMMENT ON COLUMN sops.document_type IS
  'Discriminator for the kind of document this row represents. '
  'Drives AI prompt wording, suggested template defaults, and worker-side '
  'labelling. All types share the same status lifecycle and pipeline.';

-- Index for filtered list views (Dashboard SOPs page filter chips).
-- Leading company_id matches every other tenant-scoped index in this schema.
CREATE INDEX IF NOT EXISTS sops_company_doctype_status_idx
  ON sops (company_id, document_type, status);

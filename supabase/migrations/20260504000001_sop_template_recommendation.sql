-- AI template recommendation stored alongside the manager's final choice.
--
-- sops.template          — the manager's confirmed selection (already existed,
--                          was made nullable in 20260425000001).
-- sops.template_recommendation — Haiku's suggestion, written during runConversion
--                                so the picker can pre-select and explain the choice.
--
-- Shape: { recommended: string, confidence: 'high'|'medium'|'low', reason: string }
-- Stored as JSONB so the shape can evolve without another migration.

ALTER TABLE sops
  ADD COLUMN IF NOT EXISTS template_recommendation jsonb;

COMMENT ON COLUMN sops.template_recommendation IS
  'Haiku-generated template suggestion produced during runConversion. '
  'Shape: { recommended, confidence, reason }. NULL until conversion runs.';

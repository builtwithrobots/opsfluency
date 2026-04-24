-- OpsFluency — replace single-default-template with an active-template set.
--
-- Admins now choose which templates are available to managers when creating
-- SOPs. Any subset of the four values is valid; at least one must remain
-- active (enforced at the application layer, not the DB layer, to allow
-- future flexibility).
--
-- The previous columns (default_sop_template, sop_template_locked) are left
-- in place — they are unused by the UI going forward but dropping them is a
-- destructive change with no benefit at this stage.

begin;

alter table companies
  add column if not exists active_sop_templates text[] not null
    default '{step-by-step,reference,safety-checklist,onboarding}';

commit;

-- OpsFluency — add package_key to departments.
--
-- `package_key` records which industry package a department was seeded from
-- (general | iso9001 | food-safety | healthcare). It is intentionally null
-- for all departments created before this migration — those predate the
-- industry-package concept.
--
-- This column is NOT used by any application code yet. It will be populated
-- during the onboarding seed step once that is built. Adding it now avoids a
-- separate migration at onboarding time and makes future queries
-- (e.g. "which departments belong to the iso9001 package?") straightforward.

begin;

alter table departments
  add column if not exists package_key text;

commit;

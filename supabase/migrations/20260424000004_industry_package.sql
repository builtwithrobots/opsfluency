-- OpsFluency — add industry_package to companies.
--
-- Controls which department→template recommendation map is used when a
-- manager creates a new SOP. The column is non-breaking: existing rows
-- default to 'general', which matches the original four default departments
-- (Safety, Equipment, Process, HR) and their pre-existing template choices.
--
-- Values:
--   general      — warehouse / manufacturing defaults
--   iso9001      — ISO 9001 quality management departments
--   food-safety  — food production / HACCP environments
--   healthcare   — clinical / patient-care facilities

begin;

alter table companies
  add column if not exists industry_package text not null default 'general'
    check (industry_package in ('general', 'iso9001', 'food-safety', 'healthcare'));

commit;

-- OpsFluency — replace single industry_package with a multi-select array.
--
-- Admins can now belong to more than one industry package simultaneously
-- (e.g. a facility that is both ISO 9001 and food-safety certified).
-- The old industry_package column is left in place but no longer used by
-- the UI — dropping it is destructive with no benefit at this stage.

begin;

alter table companies
  add column if not exists industry_packages text[] not null
    default '{general}';

commit;

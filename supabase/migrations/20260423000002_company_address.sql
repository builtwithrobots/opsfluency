-- OpsFluency — add address fields to companies.
--
-- Street address is captured on the org settings General tab and will
-- eventually be auto-populated during onboarding. All columns are
-- optional so existing rows are unaffected and the onboarding form can
-- be wired in incrementally.

begin;

alter table companies
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city          text,
  add column if not exists state         text,
  add column if not exists zip           text;

commit;

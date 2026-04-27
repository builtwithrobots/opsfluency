-- OpsFluency — split employee email into work + personal.
--
-- Many frontline workers have no company email address. The invite now
-- stores two optional emails:
--
--   email_work     — company email (badge, payroll systems, etc.)
--   email_personal — personal email used for Clerk magic-link re-logins
--
-- During the QR claim flow, Clerk auth email = email_personal ?? email_work.
-- If neither is present the employee authenticates only via the initial
-- sign-in token; they can add an email in their profile later.
--
-- Applies to both employee_invites (pre-claim) and employees (post-claim).
--
-- Idempotency: the rename is conditional so this migration is safe to run
-- whether migration 20260427000004 created the column as `email` or not.

begin;

-- ── employee_invites ──────────────────────────────────────────────────────────

-- Rename email → email_work only if the legacy column name still exists.
-- If 20260427000004 was never applied, or was applied in a different form,
-- the ADD COLUMN IF NOT EXISTS below handles the gap.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'employee_invites'
      and column_name  = 'email'
  ) then
    alter table employee_invites rename column email to email_work;
  end if;
end $$;

alter table employee_invites
  add column if not exists email_work     text,
  add column if not exists email_personal text;

-- ── employees ─────────────────────────────────────────────────────────────────

alter table employees
  add column if not exists email_work     text,
  add column if not exists email_personal text;

commit;

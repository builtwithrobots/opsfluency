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

begin;

-- ── employee_invites ──────────────────────────────────────────────────────────

alter table employee_invites
  rename column email to email_work;

alter table employee_invites
  add column email_personal text;

-- ── employees ─────────────────────────────────────────────────────────────────

alter table employees
  add column email_work     text,
  add column email_personal text;

commit;

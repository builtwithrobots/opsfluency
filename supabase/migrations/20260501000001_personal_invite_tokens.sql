-- Personal invite tokens + self-serve join requests.
--
-- 1. Adds `personal_invite_token` and `personal_invite_token_expires_at` to
--    `employee_invites`. The token is a cryptographically random UUID generated
--    at invite creation time. It is the sole credential for the zero-friction
--    personal-QR claim path — no phone entry required. 7-day TTL.
--
-- 2. Creates `employee_join_requests` for the self-serve path: an employee who
--    doesn't have a personal invite can scan the company QR, fill in their name
--    and phone, and submit a request. A manager approves or rejects from the
--    dashboard. Approval creates an `employee_invites` row and returns a personal
--    QR link the manager can share immediately.

begin;

-- ── 1. personal_invite_token columns ─────────────────────────────────────────

alter table employee_invites
  add column if not exists personal_invite_token              text unique,
  add column if not exists personal_invite_token_expires_at   timestamptz;

-- Partial index on unclaimed rows — the hot path for token lookups.
-- The column-level UNIQUE already prevents duplicates; this index is for
-- fast O(1) lookups that skip claimed rows without a sequential scan.
create unique index if not exists employee_invites_token_unclaimed_idx
  on employee_invites (personal_invite_token)
  where claimed_at is null;

-- ── 2. employee_join_requests ─────────────────────────────────────────────────

create table employee_join_requests (
  id                  uuid        primary key default gen_random_uuid(),
  company_id          uuid        not null references companies(id) on delete cascade,
  phone               text        not null,
  name                text        not null,
  email_personal      text,
  requested_at        timestamptz not null default now(),
  status              text        not null default 'pending'
                                  check (status in ('pending', 'approved', 'rejected')),
  reviewed_at         timestamptz,
  reviewed_by         text,        -- clerk_user_id of reviewing manager/admin
  created_invite_id   uuid        references employee_invites(id),

  -- One active pending request per phone per company. Rejected requests can be
  -- re-submitted (the unique constraint is scoped to status, not company+phone).
  unique (company_id, phone, status)
);

create index employee_join_requests_company_pending_idx
  on employee_join_requests (company_id)
  where status = 'pending';

alter table employee_join_requests enable row level security;

-- Authenticated company members (managers/admins) can read and update their
-- company's requests. Anon cannot read — prevents data leakage to the
-- self-serve form caller (who has no Clerk session).
create policy join_requests_company_isolation on employee_join_requests
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

commit;

-- Super-admin account locking.
--
-- Adds `locked_at` to company_members. A non-null value means a super
-- admin has disabled this account from the platform console. The
-- application layer (getCompanyContext) gates access on this column.
-- No Clerk session revocation is attempted — the lock takes effect on
-- the next request once the column is set.

alter table company_members
  add column if not exists locked_at timestamptz;

comment on column company_members.locked_at is
  'Non-null: account locked by a super admin. Set via /dashboard/platform → Tenants → Members.';

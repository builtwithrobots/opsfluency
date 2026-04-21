-- OpsFluency — role model v2.
--
-- Three changes in one transaction:
--
-- 1. New cross-tenant role: `super_admin`. Stored in a dedicated
--    `super_admins` table keyed by `clerk_user_id`, NOT in
--    `company_members` — a super_admin is not a member of any one
--    company. Modeling it outside the tenant-scoped table keeps the
--    `unique(company_id, clerk_user_id)` semantics intact and leaves
--    every tenant-scoped query on the normal fast path.
--
-- 2. Rename the org-scoped non-privileged role from `worker` to
--    `employee`. Drop and recreate the CHECK constraint, update the
--    column default, and migrate any existing rows.
--
-- 3. Extend every tenant-scoped RLS policy to allow `is_super_admin()`
--    callers through unconditionally (god mode). Managers/admins/
--    employees still see only their own company's rows.
--
-- Idempotency: this migration is NOT blindly idempotent — it issues
-- DDL that would error on re-run (e.g. `CREATE TABLE super_admins`).
-- It's designed to be applied exactly once, like every other
-- migration in this directory.

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. `super_admins` — cross-tenant god-mode allowlist.
--
-- Locked at grant level (service_role only). No RLS needed — the table
-- never surfaces to anon/authenticated callers directly; they always
-- go through `is_super_admin()` which is SECURITY DEFINER and bypasses
-- the grant check.
-- ────────────────────────────────────────────────────────────────────────────

create table super_admins (
  id            uuid        primary key default gen_random_uuid(),
  clerk_user_id text        not null unique,
  note          text,
  created_at    timestamptz not null default now()
);

revoke all on table super_admins from anon, authenticated;

-- Seeding: insert your own Clerk user id manually via the SQL editor
-- (or the admin client) after signing up. Example:
--   insert into super_admins (clerk_user_id, note)
--   values ('user_XXXXXXXX', 'Owner');

-- ────────────────────────────────────────────────────────────────────────────
-- 2. `is_super_admin()` — RLS helper mirroring `requesting_company_id()`.
--
-- SECURITY DEFINER + locked search_path for the same reasons as the
-- other helpers: avoids policy recursion and search-path injection.
-- ────────────────────────────────────────────────────────────────────────────

create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.super_admins sa
    where sa.clerk_user_id = auth.jwt() ->> 'sub'
  )
$$;

revoke all on function is_super_admin() from public;
grant  execute on function is_super_admin() to anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Rename the org-scoped non-privileged role: `worker` → `employee`.
--
-- Order matters: drop the old CHECK first, then migrate data, then add
-- the new CHECK. Can't add the new CHECK while `worker` rows exist, and
-- can't update to `employee` while the old CHECK still rejects it.
-- ────────────────────────────────────────────────────────────────────────────

alter table company_members drop constraint company_members_role_check;

update company_members
   set role = 'employee'
 where role = 'worker';

alter table company_members
  add constraint company_members_role_check
  check (role in ('admin', 'manager', 'employee'));

alter table company_members
  alter column role set default 'employee';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Extend tenant RLS policies with super_admin bypass.
--
-- `super_admin` ≠ a member of any company, so the tenant predicate
-- `company_id = requesting_company_id()` returns null for them and
-- would block every query. Adding `or is_super_admin()` lets god-mode
-- tooling (cross-tenant support dashboards, migrations, audit views)
-- reach every company's data while normal callers stay isolated.
-- ────────────────────────────────────────────────────────────────────────────

alter policy companies_self_read on companies
  using (id = requesting_company_id() or is_super_admin());

alter policy company_members_self_read on company_members
  using (company_id = requesting_company_id() or is_super_admin());

alter policy departments_company_isolation on departments
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

commit;

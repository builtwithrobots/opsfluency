-- OpsFluency — corrective migration for the RLS helpers + bootstrap grant.
--
-- Why this file exists (and not an amendment of 20260421000001_init.sql):
-- the init migration was applied to at least one environment via the
-- Supabase SQL editor before these fixes existed. Migrations are
-- immutable once applied anywhere, so the fixes land here instead of
-- rewriting history.
--
-- Three bugs addressed, all surfaced by running the init migration
-- against a local Postgres with a Supabase-compatible shim:
--
-- 1. (critical) requesting_company_id() / requesting_role() recurse
--    forever when invoked from an RLS policy on company_members — the
--    helper SELECTs from company_members, which re-enters the same
--    policy, which re-calls the helper, and so on. Fix: mark both
--    helpers SECURITY DEFINER with SET search_path = public, auth. The
--    helper's own SELECT skips RLS while the calling query's policies
--    still apply normally.
--
-- 2. (hardening) Lock the helpers down: PUBLIC revoked, explicit
--    EXECUTE grants to anon / authenticated / service_role.
--
-- 3. (critical) bootstrap_company() was REVOKE'd from PUBLIC / anon /
--    authenticated but never explicitly GRANTed to service_role.
--    BYPASSRLS lets the function see past RLS, but EXECUTE is a
--    separate Postgres privilege. Admin client would have hit
--    `permission denied for function` on the first signup.
--
-- This migration is idempotent: every statement is safe to re-run.
-- `create or replace function` replaces in place, `revoke` and `grant`
-- are no-ops when already in the target state.
--
-- Applied via: `supabase db push` (Supabase CLI). Also safe to paste
-- into the Supabase SQL editor if CLI access is unavailable.

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Reaffirm the RLS helpers as SECURITY DEFINER with a locked search_path.
-- ────────────────────────────────────────────────────────────────────────────

create or replace function requesting_company_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select cm.company_id
  from public.company_members cm
  where cm.clerk_user_id = auth.jwt() ->> 'sub'
  limit 1
$$;

create or replace function requesting_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select cm.role
  from public.company_members cm
  where cm.clerk_user_id = auth.jwt() ->> 'sub'
  limit 1
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Lock the helpers down at the grant level (principle of least privilege).
-- ────────────────────────────────────────────────────────────────────────────

revoke all on function requesting_company_id() from public;
revoke all on function requesting_role()       from public;
grant  execute on function requesting_company_id() to anon, authenticated, service_role;
grant  execute on function requesting_role()       to anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Grant EXECUTE on bootstrap_company() to service_role — missing from
--    the init migration, which only REVOKE'd. BYPASSRLS ≠ EXECUTE.
-- ────────────────────────────────────────────────────────────────────────────

grant execute on function bootstrap_company(text, text, text, text) to service_role;

commit;

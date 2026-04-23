-- OpsFluency — demo tenant scaffolding for the super-admin seed tool.
--
-- Three things in one transaction:
--
-- 1. `companies.is_demo` — a write-once flag that distinguishes demo
--    tenants from real ones. Seed and delete RPCs refuse to touch rows
--    where this is false, so the "delete demo" button can never nuke
--    a real customer by accident.
--
-- 2. `bootstrap_demo_company(p_name, p_admin_clerk_user_id)` — mirrors
--    the existing `bootstrap_company` RPC but sets `is_demo=true` and
--    lets the caller pass a `company_members.clerk_user_id` that is
--    NOT the caller's own Clerk id. Super admins are not members of
--    any company, so the admin row is written for whoever is running
--    the seeder. If the super admin is also a real company member
--    elsewhere that's fine — `company_members` is keyed by
--    `(company_id, clerk_user_id)`, so this insert never collides.
--
-- 3. `delete_demo_tenant(p_company_id)` — cascading delete guarded by
--    `is_demo = true`. All rows in child tables (company_members,
--    departments, qr_codes, qr_scans, ...) are removed by the
--    existing `on delete cascade` foreign keys.
--
-- Grants: both RPCs are SECURITY DEFINER, REVOKE'd from public / anon /
-- authenticated, and GRANTed to service_role only. The seed Server
-- Action goes through the admin client.

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. `companies.is_demo` flag.
-- ────────────────────────────────────────────────────────────────────────────

alter table companies
  add column if not exists is_demo boolean not null default false;

-- Partial index so "list demo tenants" on the Seed tab is cheap even
-- when the overall companies table grows.
create index if not exists companies_is_demo_idx
  on companies (created_at desc)
  where is_demo = true;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. `bootstrap_demo_company(p_name, p_admin_clerk_user_id)`
-- ────────────────────────────────────────────────────────────────────────────

create or replace function bootstrap_demo_company(
  p_name                 text,
  p_admin_clerk_user_id  text
)
returns companies
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company companies;
begin
  insert into companies (name, phone, is_demo)
  values (p_name, '(555) 010-0001', true)
  returning * into new_company;

  -- Admin member for the super admin running the seeder. Gives them a
  -- manager-UI entry point into the demo tenant via impersonation
  -- (and a direct member row if they ever want to open it without
  -- impersonation too).
  insert into company_members (company_id, clerk_user_id, role, joined_at)
  values (new_company.id, p_admin_clerk_user_id, 'admin', now())
  on conflict (company_id, clerk_user_id) do nothing;

  -- Default departments, same list the real bootstrap uses.
  insert into departments (company_id, name)
  select new_company.id, dept
  from unnest(array['Safety', 'Equipment', 'Process', 'HR']) as dept
  on conflict (company_id, name) do nothing;

  return new_company;
end;
$$;

revoke all on function bootstrap_demo_company(text, text) from public;
revoke all on function bootstrap_demo_company(text, text) from anon, authenticated;
grant  execute on function bootstrap_demo_company(text, text) to service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. `delete_demo_tenant(p_company_id)`
-- ────────────────────────────────────────────────────────────────────────────

create or replace function delete_demo_tenant(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  is_demo_row boolean;
begin
  select is_demo into is_demo_row
  from companies
  where id = p_company_id;

  if is_demo_row is null then
    raise exception 'Company % does not exist', p_company_id
      using errcode = 'no_data_found';
  end if;

  if not is_demo_row then
    raise exception 'Company % is not a demo tenant; refusing to delete', p_company_id
      using errcode = 'insufficient_privilege';
  end if;

  -- FK cascades handle company_members / departments / qr_codes /
  -- qr_scans / impersonation_events. Anything added later that
  -- references companies(id) must carry `on delete cascade` or the
  -- delete here will fail — intentional forcing function so new
  -- tenant-scoped tables stay cleanable.
  delete from companies where id = p_company_id;
end;
$$;

revoke all on function delete_demo_tenant(uuid) from public;
revoke all on function delete_demo_tenant(uuid) from anon, authenticated;
grant  execute on function delete_demo_tenant(uuid) to service_role;

commit;

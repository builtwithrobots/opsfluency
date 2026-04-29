-- OpsFluency — personal sandbox company per super admin.
--
-- A sandbox is a private company environment owned by one super admin for
-- testing SOPs, QR codes, employee flows, and announcements without touching
-- real tenant data or demo tenants. One sandbox per super admin; creation is
-- idempotent. Separate from demo tenants (is_demo) so the seed tab's
-- delete-demo guard cannot accidentally wipe a sandbox.
--
-- Three changes:
--   1. `companies.is_sandbox` flag (write-once, not exposed to RLS callers).
--   2. `bootstrap_sandbox_company(p_admin_clerk_user_id)` — idempotent create.
--   3. `delete_sandbox_company(p_company_id)` — guarded delete.
--
-- Both RPCs are SECURITY DEFINER, REVOKE'd from anon/authenticated, and
-- GRANT'd to service_role only. The sandbox Server Actions go through the
-- admin client.

begin;

-- ── 1. is_sandbox flag ───────────────────────────────────────────────────────

alter table companies
  add column if not exists is_sandbox boolean not null default false;

-- Partial index: "find my sandbox" scans only this tiny subset of companies.
create index if not exists companies_is_sandbox_idx
  on companies (created_at desc)
  where is_sandbox = true;

-- ── 2. bootstrap_sandbox_company ────────────────────────────────────────────

create or replace function bootstrap_sandbox_company(
  p_admin_clerk_user_id text
)
returns companies
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_company companies;
  new_company      companies;
begin
  -- Return the existing sandbox for this super admin if one already exists.
  select c.* into existing_company
  from   companies c
  join   company_members cm on cm.company_id = c.id
  where  c.is_sandbox = true
    and  cm.clerk_user_id = p_admin_clerk_user_id
  limit  1;

  if found then
    return existing_company;
  end if;

  -- Fresh sandbox — not a demo tenant (is_demo stays false).
  insert into companies (name, phone, is_sandbox)
  values ('Sandbox', '(555) 000-0000', true)
  returning * into new_company;

  -- Add the super admin as an admin member so impersonation and direct
  -- company_members lookups both resolve correctly.
  insert into company_members (company_id, clerk_user_id, role, joined_at)
  values (new_company.id, p_admin_clerk_user_id, 'admin', now())
  on conflict (company_id, clerk_user_id) do nothing;

  -- Same default departments the real bootstrap_company seeds.
  insert into departments (company_id, name)
  select new_company.id, dept
  from   unnest(array['Safety', 'Equipment', 'Process', 'HR']) as dept
  on conflict (company_id, name) do nothing;

  return new_company;
end;
$$;

revoke all on function bootstrap_sandbox_company(text) from public;
revoke all on function bootstrap_sandbox_company(text) from anon, authenticated;
grant  execute on function bootstrap_sandbox_company(text) to service_role;

-- ── 3. delete_sandbox_company ────────────────────────────────────────────────

create or replace function delete_sandbox_company(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  is_sandbox_row boolean;
begin
  select is_sandbox into is_sandbox_row
  from   companies
  where  id = p_company_id;

  if is_sandbox_row is null then
    raise exception 'Company % does not exist', p_company_id
      using errcode = 'no_data_found';
  end if;

  if not is_sandbox_row then
    raise exception 'Company % is not a sandbox; refusing to delete', p_company_id
      using errcode = 'insufficient_privilege';
  end if;

  -- FK ON DELETE CASCADE handles company_members, departments, qr_codes,
  -- qr_scans, impersonation_events, and every other tenant-scoped table.
  delete from companies where id = p_company_id;
end;
$$;

revoke all on function delete_sandbox_company(uuid) from public;
revoke all on function delete_sandbox_company(uuid) from anon, authenticated;
grant  execute on function delete_sandbox_company(uuid) to service_role;

commit;

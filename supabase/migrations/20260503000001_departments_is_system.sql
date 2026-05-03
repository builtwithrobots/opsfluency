-- Mark seeded default departments as system-managed so they cannot be
-- renamed or deleted by managers.
--
-- Background: bootstrap_company() seeds five departments on every new
-- tenant — HR, Manufacturing, Quality Control, Safety, Warehouse.
-- Until now only HR was protected (by a name-match check in the
-- delete/rename Server Actions). The other four were freely editable,
-- which meant a manager could rename or delete a default the rest of
-- the product treats as a fixture.
--
-- This migration:
--   1. Adds `is_system boolean not null default false` to departments.
--   2. Back-fills `is_system = true` on existing rows whose name matches
--      one of the canonical seeded defaults.
--   3. Updates bootstrap_company() so newly seeded defaults are marked
--      `is_system = true` at insert time.
--
-- Application-layer rename/delete checks shift from `name = 'HR'` to
-- `is_system = true` in the same PR.

begin;

-- ── 1. Schema ──────────────────────────────────────────────────────────────

alter table departments
  add column if not exists is_system boolean not null default false;

comment on column departments.is_system is
  'True for departments seeded by bootstrap_company(). Cannot be renamed or deleted by managers.';

-- ── 2. Back-fill existing tenants ──────────────────────────────────────────

update departments
set    is_system = true
where  name in ('HR', 'Manufacturing', 'Quality Control', 'Safety', 'Warehouse')
  and  is_system = false;

-- ── 3. bootstrap_company() — set is_system on seeded inserts ───────────────

create or replace function bootstrap_company(
  p_name                 text,
  p_phone                text,
  p_logo_url             text,
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
  insert into companies (name, phone, logo_url)
  values (p_name, p_phone, p_logo_url)
  returning * into new_company;

  insert into company_members (company_id, clerk_user_id, role, is_owner, joined_at)
  values (new_company.id, p_admin_clerk_user_id, 'admin', true, now());

  -- Five default departments, seeded alphabetically. Marked is_system so
  -- the rename/delete Server Actions reject mutation.
  insert into departments (company_id, name, is_system)
  select new_company.id, dept, true
  from unnest(array['HR', 'Manufacturing', 'Quality Control', 'Safety', 'Warehouse']) as dept
  on conflict (company_id, name) do nothing;

  -- Bilingual tags linked to the seeded departments.
  insert into tags (company_id, name_en, name_es, color, source, department_id)
  select
    new_company.id,
    d.name,
    case d.name
      when 'HR'              then 'RR.HH.'
      when 'Manufacturing'   then 'Manufactura'
      when 'Quality Control' then 'Control de Calidad'
      when 'Safety'          then 'Seguridad'
      when 'Warehouse'       then 'Almacén'
      else d.name
    end,
    case d.name
      when 'HR'              then '#a855f7'
      when 'Manufacturing'   then '#3b82f6'
      when 'Quality Control' then '#f59e0b'
      when 'Safety'          then '#ef4444'
      when 'Warehouse'       then '#22c55e'
      else '#6b7280'
    end,
    'department',
    d.id
  from departments d
  where d.company_id = new_company.id
    and d.name in ('HR', 'Manufacturing', 'Quality Control', 'Safety', 'Warehouse')
  on conflict (company_id, lower(name_en)) do nothing;

  return new_company;
end;
$$;

commit;

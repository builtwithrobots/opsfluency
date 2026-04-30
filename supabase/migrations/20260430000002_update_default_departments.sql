-- Change default departments from Safety/Equipment/Process/HR to
-- HR/Manufacturing/Quality Control/Safety/Warehouse (alphabetical).
-- Updates bootstrap_company() so all new tenants get the new set.

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

  -- Five default departments, seeded alphabetically.
  insert into departments (company_id, name)
  select new_company.id, dept
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

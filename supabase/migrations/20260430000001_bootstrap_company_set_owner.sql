-- Fix bootstrap_company() to mark the founding admin as is_owner=true.
-- Previously the column defaulted to false for new companies; the
-- back-fill in 20260428000001 only fixed historical rows.

begin;

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

  insert into departments (company_id, name)
  select new_company.id, dept
  from unnest(array['Safety', 'Equipment', 'Process', 'HR']) as dept
  on conflict (company_id, name) do nothing;

  -- Seed bilingual department tags linked to the just-created departments.
  insert into tags (company_id, name_en, name_es, color, source, department_id)
  select
    new_company.id,
    d.name,
    case d.name
      when 'Safety'    then 'Seguridad'
      when 'Equipment' then 'Equipos'
      when 'Process'   then 'Proceso'
      when 'HR'        then 'RR.HH.'
      else d.name
    end,
    case d.name
      when 'Safety'    then '#ef4444'
      when 'Equipment' then '#3b82f6'
      when 'Process'   then '#22c55e'
      when 'HR'        then '#a855f7'
      else '#6b7280'
    end,
    'department',
    d.id
  from departments d
  where d.company_id = new_company.id
    and d.name in ('Safety', 'Equipment', 'Process', 'HR')
  on conflict (company_id, lower(name_en)) do nothing;

  return new_company;
end;
$$;

commit;

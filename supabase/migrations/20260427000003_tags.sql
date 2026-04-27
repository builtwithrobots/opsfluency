-- OpsFluency — shared company tag vocabulary for glossary terms and SOPs.
--
-- Adds:
--   1. `tags`               — bilingual company-scoped label definitions
--   2. `glossary_term_tags` — junction: glossary_terms ↔ tags
--   3. `sop_tags`           — junction: sops ↔ tags
--   4. RLS on all three tables
--   5. Backfill: seed four department tags for all existing companies
--   6. Redefine bootstrap_company to seed department tags for new companies

begin;

-- ── 1. tags ───────────────────────────────────────────────────────────────────

create table tags (
  id            uuid        primary key default gen_random_uuid(),
  company_id    uuid        not null references companies(id) on delete cascade,
  name_en       text        not null check (char_length(name_en) between 1 and 60),
  name_es       text        not null check (char_length(name_es) between 1 and 60),
  color         text        not null default '#6b7280',
  source        text        not null default 'custom'
                            check (source in ('department', 'custom')),
  department_id uuid        references departments(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Functional unique index: case-insensitive name_en per company.
-- Must be a separate CREATE UNIQUE INDEX — inline UNIQUE constraints
-- don't accept expressions in PostgreSQL.
create unique index tags_company_name_en_lower_idx on tags (company_id, lower(name_en));

create index tags_company_id_idx on tags (company_id);

alter table tags enable row level security;

create policy tags_company_isolation on tags
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

-- ── 2. glossary_term_tags ─────────────────────────────────────────────────────

create table glossary_term_tags (
  term_id uuid not null references glossary_terms(id) on delete cascade,
  tag_id  uuid not null references tags(id)            on delete cascade,
  primary key (term_id, tag_id)
);

create index glossary_term_tags_tag_id_idx  on glossary_term_tags (tag_id);
create index glossary_term_tags_term_id_idx on glossary_term_tags (term_id);

alter table glossary_term_tags enable row level security;

-- Policy joins through glossary_terms to resolve company_id.
create policy glossary_term_tags_company_isolation on glossary_term_tags
  for all to authenticated
  using (
    exists (
      select 1 from glossary_terms t
      where t.id = term_id
        and (t.company_id = requesting_company_id() or is_super_admin())
    )
  )
  with check (
    exists (
      select 1 from glossary_terms t
      where t.id = term_id
        and (t.company_id = requesting_company_id() or is_super_admin())
    )
  );

-- ── 3. sop_tags ───────────────────────────────────────────────────────────────

create table sop_tags (
  sop_id uuid not null references sops(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (sop_id, tag_id)
);

create index sop_tags_tag_id_idx on sop_tags (tag_id);
create index sop_tags_sop_id_idx on sop_tags (sop_id);

alter table sop_tags enable row level security;

-- Policy joins through sops to resolve company_id.
create policy sop_tags_company_isolation on sop_tags
  for all to authenticated
  using (
    exists (
      select 1 from sops s
      where s.id = sop_id
        and (s.company_id = requesting_company_id() or is_super_admin())
    )
  )
  with check (
    exists (
      select 1 from sops s
      where s.id = sop_id
        and (s.company_id = requesting_company_id() or is_super_admin())
    )
  );

-- ── 4. Backfill department tags for existing companies ────────────────────────
-- Seeds Safety/Seguridad, Equipment/Equipos, Process/Proceso, HR/RR.HH. for
-- every company that already has those departments. Idempotent via ON CONFLICT.

insert into tags (company_id, name_en, name_es, color, source, department_id)
select
  d.company_id,
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
where d.name in ('Safety', 'Equipment', 'Process', 'HR')
on conflict (company_id, lower(name_en)) do nothing;

-- ── 5. Update bootstrap_company to seed department tags for new companies ─────
-- Redefined with the same 4-param signature. Existing GRANT EXECUTE to
-- service_role is preserved by CREATE OR REPLACE.

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

  insert into company_members (company_id, clerk_user_id, role, joined_at)
  values (new_company.id, p_admin_clerk_user_id, 'admin', now());

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

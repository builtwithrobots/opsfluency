-- OpsFluency — SOPs + SOP versions + org template preference.
--
-- 1. Creates `sops` master table (one row per SOP, no content).
-- 2. Creates `sop_versions` table (versioned content in EN + ES).
-- 3. Adds `default_sop_template` and `sop_template_locked` to `companies`.
-- 4. Enables RLS on `companies` (previously unprotected; now allows members
--    to read their own company row and admins to update template columns).
-- 5. RLS on `sops` and `sop_versions` follows the standard company-isolation
--    pattern every other tenant table uses.

begin;

-- ── 1. sops master table ──────────────────────────────────────────────────────

create table sops (
  id            uuid        primary key default gen_random_uuid(),
  company_id    uuid        not null references companies(id)    on delete cascade,
  department_id uuid                 references departments(id)  on delete set null,
  title         text        not null check (char_length(title) between 1 and 200),
  status        text        not null default 'draft'
                            check (status in (
                              'draft', 'pending_terms', 'pending_translation',
                              'pending_approval', 'published', 'archived'
                            )),
  template      text        not null
                            check (template in (
                              'step-by-step', 'reference',
                              'safety-checklist', 'onboarding'
                            )),
  created_by    text        not null,  -- clerk_user_id
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index sops_company_id_status_idx on sops (company_id, status);
create index sops_company_id_dept_idx   on sops (company_id, department_id);
create index sops_company_id_created_idx on sops (company_id, created_at desc);

-- Keep updated_at in sync automatically.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sops_set_updated_at
  before update on sops
  for each row execute function set_updated_at();

-- ── 2. sop_versions table ─────────────────────────────────────────────────────

create table sop_versions (
  id                  uuid        primary key default gen_random_uuid(),
  sop_id              uuid        not null references sops(id)       on delete cascade,
  company_id          uuid        not null references companies(id)   on delete cascade,
  version_number      integer     not null,
  content_en          text,
  content_es          text,
  needs_retranslation boolean     not null default false,
  flagged_terms       jsonb,
  original_file_url   text,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  unique (sop_id, version_number)
);

create index sop_versions_sop_id_idx      on sop_versions (sop_id);
create index sop_versions_company_id_idx  on sop_versions (company_id);

-- ── 3. Company template preference ───────────────────────────────────────────

alter table companies
  add column if not exists default_sop_template text
    check (default_sop_template in (
      'step-by-step', 'reference', 'safety-checklist', 'onboarding'
    )),
  add column if not exists sop_template_locked boolean not null default false;

-- ── 4. RLS on companies ───────────────────────────────────────────────────────
-- Companies had no RLS before this migration. Adding it now:
--   - Members can SELECT their own company row.
--   - Members can UPDATE their own company row (Server Actions enforce role
--     checks before reaching this; RLS is the last line of defence).
--   - INSERT / DELETE remain service-role-only (bootstrap_company RPC handles
--     creates; deletions only via admin tooling).
-- Super admins pass via is_super_admin() on both policies.

alter table companies enable row level security;

create policy companies_member_read on companies
  for select to authenticated
  using (id = requesting_company_id() or is_super_admin());

create policy companies_member_update on companies
  for update to authenticated
  using      (id = requesting_company_id() or is_super_admin())
  with check (id = requesting_company_id() or is_super_admin());

-- ── 5. RLS on sops + sop_versions ────────────────────────────────────────────

alter table sops enable row level security;

create policy sops_company_isolation on sops
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

alter table sop_versions enable row level security;

create policy sop_versions_company_isolation on sop_versions
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

commit;

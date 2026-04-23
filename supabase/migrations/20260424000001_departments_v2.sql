-- OpsFluency — extend departments with color/icon and add employee_departments.
--
-- 1. Adds `color_key` and `icon_key` columns to `departments`. Both are NOT
--    NULL with safe defaults so existing rows (the four seeded defaults) stay
--    valid without a backfill. Admins can update them via the Departments tab.
--
-- 2. Creates `employee_departments` — the many-to-many junction between
--    `company_members` and `departments`. RLS follows the same pattern as
--    every other company-scoped table: `requesting_company_id() OR is_super_admin()`.

begin;

-- ── 1. Extend departments ─────────────────────────────────────────────────────

alter table departments
  add column if not exists color_key text not null default 'zinc',
  add column if not exists icon_key  text not null default 'building-2';

alter table departments
  add constraint departments_color_key_check
    check (color_key in (
      'sky','emerald','amber','violet','rose','orange','teal','indigo','yellow','zinc'
    )),
  add constraint departments_icon_key_check
    check (icon_key in (
      'shield-check','wrench','users','clipboard-list',
      'zap','hard-hat','flask-conical','building-2'
    ));

-- ── 2. employee_departments junction table ────────────────────────────────────

create table if not exists employee_departments (
  id            uuid        primary key default gen_random_uuid(),
  company_id    uuid        not null references companies(id)       on delete cascade,
  department_id uuid        not null references departments(id)     on delete cascade,
  member_id     uuid        not null references company_members(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  unique (department_id, member_id)
);

-- Three access patterns covered:
--   "members in dept X"   → dept_idx
--   "depts for member Y"  → member_idx (future employee profile)
--   RLS isolation predicate → co_idx
create index if not exists employee_departments_dept_idx   on employee_departments (department_id);
create index if not exists employee_departments_member_idx on employee_departments (member_id);
create index if not exists employee_departments_co_idx     on employee_departments (company_id);

alter table employee_departments enable row level security;

create policy employee_departments_company_isolation
  on employee_departments
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

commit;

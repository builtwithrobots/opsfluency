-- HR Contacts — company-scoped directory of people workers can reach
-- for HR questions. Rendered as contact cards at the bottom of any
-- SOP using the "onboarding" template.
--
-- Schema is intentionally minimal for MVP: name + title + email + phone.
-- photo_url is nullable (many companies won't upload headshots yet).
-- sort_order lets managers control card sequence without drag-and-drop
-- complexity — lower numbers appear first.

begin;

-- ── 1. Table ───────────────────────────────────────────────────────────────

create table hr_contacts (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references companies(id) on delete cascade,
  name         text        not null check (char_length(name) between 1 and 100),
  title        text        not null check (char_length(title) between 1 and 100),
  email        text,
  phone        text,
  photo_url    text,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index hr_contacts_company_id_idx on hr_contacts (company_id, sort_order);

comment on table hr_contacts is
  'HR contacts shown as cards at the bottom of onboarding-template SOPs.';

-- ── 2. updated_at trigger ─────────────────────────────────────────────────

create trigger hr_contacts_updated_at
  before update on hr_contacts
  for each row execute function set_updated_at();

-- ── 3. RLS ────────────────────────────────────────────────────────────────

alter table hr_contacts enable row level security;

-- Managers and admins can read, insert, update, delete.
-- Employees can only read (worker PWA shows contact cards).
-- Super admins bypass via is_super_admin().

create policy hr_contacts_select on hr_contacts
  for select to authenticated
  using (company_id = requesting_company_id() or is_super_admin());

create policy hr_contacts_insert on hr_contacts
  for insert to authenticated
  with check (
    company_id = requesting_company_id()
    and (requesting_role() in ('admin', 'manager') or is_super_admin())
  );

create policy hr_contacts_update on hr_contacts
  for update to authenticated
  using (
    company_id = requesting_company_id()
    and (requesting_role() in ('admin', 'manager') or is_super_admin())
  )
  with check (
    company_id = requesting_company_id()
    and (requesting_role() in ('admin', 'manager') or is_super_admin())
  );

create policy hr_contacts_delete on hr_contacts
  for delete to authenticated
  using (
    company_id = requesting_company_id()
    and (requesting_role() in ('admin', 'manager') or is_super_admin())
  );

commit;

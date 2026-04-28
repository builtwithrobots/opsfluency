-- Announcements: department-scoped or org-wide messages from managers.
-- department_id = NULL means org-wide (visible to everyone in the company).

create table announcements (
  id            uuid        primary key default gen_random_uuid(),
  company_id    uuid        not null references companies(id) on delete cascade,
  department_id uuid        references departments(id) on delete set null,
  created_by    text        not null,
  title_en      text        not null check (char_length(title_en) between 1 and 200),
  title_es      text        not null default '',
  body_en       text        not null check (char_length(body_en) between 1 and 2000),
  body_es       text        not null default '',
  priority      text        not null default 'normal'
                            check (priority in ('normal', 'urgent')),
  pinned        boolean     not null default false,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table announcements enable row level security;

create policy announcements_company_isolation on announcements
  for all to authenticated
  using  (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

-- One read receipt per (announcement, member). Employees can only see/write
-- their own rows; managers can read all receipts for analytics (Phase 2).
create table announcement_reads (
  id                uuid        primary key default gen_random_uuid(),
  announcement_id   uuid        not null references announcements(id) on delete cascade,
  company_member_id uuid        not null references company_members(id) on delete cascade,
  read_at           timestamptz not null default now(),
  unique (announcement_id, company_member_id)
);

alter table announcement_reads enable row level security;

create policy reads_own_rows on announcement_reads
  for all to authenticated
  using (
    company_member_id = (
      select id from company_members
      where clerk_user_id = auth.jwt() ->> 'sub'
      limit 1
    )
  )
  with check (
    company_member_id = (
      select id from company_members
      where clerk_user_id = auth.jwt() ->> 'sub'
      limit 1
    )
  );

create index idx_announcements_company_created
  on announcements (company_id, created_at desc);

create index idx_announcement_reads_member
  on announcement_reads (company_member_id, announcement_id);

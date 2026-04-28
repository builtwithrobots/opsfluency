-- Team invite system + org owner marker.
--
-- 1. Adds `is_owner BOOLEAN` to company_members. The owner is the org
--    creator — cannot be removed via the UI.
-- 2. Back-fills existing data: earliest joined admin per company becomes
--    the owner.
-- 3. Creates `team_invites` for email-based admin/manager invitations.
--    Token-based claim flow so anyone with the link can accept regardless
--    of which email they sign up with.

begin;

-- ── 1. is_owner ────────────────────────────────────────────────────────────

alter table company_members
  add column if not exists is_owner boolean not null default false;

comment on column company_members.is_owner is
  'True for the original org creator. Set once on bootstrap; never cleared.';

-- Back-fill: earliest admin (by joined_at then created_at) per company.
with first_admins as (
  select distinct on (company_id) id
  from company_members
  where role = 'admin'
  order by company_id, joined_at asc nulls last, created_at asc
)
update company_members cm
set    is_owner = true
from   first_admins fa
where  cm.id = fa.id;

-- ── 2. team_invites ────────────────────────────────────────────────────────

create table team_invites (
  id                       uuid        primary key default gen_random_uuid(),
  company_id               uuid        not null references companies(id) on delete cascade,
  token                    uuid        not null default gen_random_uuid() unique,
  email                    text        not null,
  name                     text,
  role                     text        not null check (role in ('admin', 'manager')),
  invited_by               text        not null,   -- clerk_user_id
  invited_at               timestamptz not null default now(),
  claimed_at               timestamptz,
  claimed_by_clerk_user_id text
);

-- One unclaimed invite per email per company at a time.
create unique index team_invites_company_email_unclaimed
  on team_invites (company_id, lower(email))
  where claimed_at is null;

create index team_invites_company_unclaimed_idx
  on team_invites (company_id)
  where claimed_at is null;

create index team_invites_token_idx on team_invites (token);

alter table team_invites enable row level security;

create policy team_invites_company_isolation on team_invites
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

commit;

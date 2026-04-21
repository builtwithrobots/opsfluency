-- OpsFluency — first migration.
--
-- Lands the multi-tenancy spine (companies, company_members, departments),
-- the RLS helper (requesting_company_id), policies on every company-scoped
-- table, the ai_call_log cost-tracking table, and the atomic
-- bootstrap_company() RPC that creates a company + admin member + default
-- departments in a single transaction.
--
-- Prerequisite (one-time, Supabase dashboard):
--   Authentication → Third-party Auth → add Clerk as a provider.
--   Clerk's JWT `sub` claim becomes the value returned by `auth.jwt() ->> 'sub'`.
--
-- Applied via: `supabase db push` (Supabase CLI).

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────────────────────

create table companies (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  phone      text,
  logo_url   text,
  created_at timestamptz not null default now()
);

create table company_members (
  id              uuid        primary key default gen_random_uuid(),
  company_id      uuid        not null references companies(id) on delete cascade,
  clerk_user_id   text        not null,
  role            text        not null default 'worker'
                             check (role in ('admin', 'manager', 'worker')),
  invited_at      timestamptz,
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  unique (company_id, clerk_user_id)
);

create index company_members_clerk_user_id_idx on company_members (clerk_user_id);

create table departments (
  id         uuid        primary key default gen_random_uuid(),
  company_id uuid        not null references companies(id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create index departments_company_id_idx on departments (company_id);

-- ai_call_log: write-only from the service-role client. Intentionally
-- outside the RLS surface — it's cost telemetry, not tenant data, and we
-- always want to capture a row regardless of who triggered the call.
create table ai_call_log (
  id            uuid        primary key default gen_random_uuid(),
  model         text        not null,
  input_tokens  integer     not null,
  output_tokens integer     not null,
  sop_id        uuid,
  company_id    uuid,
  duration_ms   integer     not null,
  created_at    timestamptz not null default now()
);

create index ai_call_log_company_id_created_at_idx
  on ai_call_log (company_id, created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- RLS helper — resolves the current caller's company from the Clerk JWT.
--
-- Supabase is configured to trust Clerk as a third-party auth provider, so
-- `auth.jwt()` returns Clerk's native JWT. The `sub` claim is the Clerk
-- user id (the value we store in `company_members.clerk_user_id`).
--
-- `security definer` is required: these helpers are called from RLS
-- policies on `company_members`, so running them as invoker would re-enter
-- the same policies and recurse forever (stack-overflow on every query).
-- Running as definer lets the helper's own SELECT skip RLS while the
-- calling query's policies still apply normally.
-- `set search_path = public, auth` prevents search-path injection — the
-- standard precaution for any security-definer function.
-- ────────────────────────────────────────────────────────────────────────────

create or replace function requesting_company_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select cm.company_id
  from public.company_members cm
  where cm.clerk_user_id = auth.jwt() ->> 'sub'
  limit 1
$$;

-- Also expose the role for policies that need to distinguish manager/admin
-- from worker. Returns null for callers without a company_members row.
create or replace function requesting_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select cm.role
  from public.company_members cm
  where cm.clerk_user_id = auth.jwt() ->> 'sub'
  limit 1
$$;

-- Lock down the helpers: PUBLIC cannot call them; anon/authenticated/
-- service_role explicitly granted. Matches the principle-of-least-
-- privilege stance we use throughout the schema.
revoke all on function requesting_company_id() from public;
revoke all on function requesting_role()       from public;
grant  execute on function requesting_company_id() to anon, authenticated, service_role;
grant  execute on function requesting_role()       to anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- RLS policies
-- ────────────────────────────────────────────────────────────────────────────

-- `companies`: members can read their own company row (needed to render the
-- manager dashboard). All writes go through the admin client (service role)
-- during bootstrap / billing updates — not from end-user sessions.
alter table companies enable row level security;

create policy companies_self_read on companies
  for select to authenticated
  using (id = requesting_company_id());

-- `company_members`: members can read the roster of their own company.
-- Writes are admin-client only (invite flows use service role to create rows).
alter table company_members enable row level security;

create policy company_members_self_read on company_members
  for select to authenticated
  using (company_id = requesting_company_id());

-- `departments`: full CRUD within the caller's own company, gated by role
-- at the application layer. RLS prevents cross-tenant access regardless.
alter table departments enable row level security;

create policy departments_company_isolation on departments
  for all to authenticated
  using (company_id = requesting_company_id())
  with check (company_id = requesting_company_id());

-- `ai_call_log`: no RLS by design. Service-role only. Lock it down at the
-- grant level instead.
revoke all on table ai_call_log from anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- Atomic company bootstrap.
--
-- Called from the admin-signup Server Action (via the service-role client)
-- after Clerk creates the user. Runs the three inserts inside one
-- transaction so a partial failure never leaves a company with no members
-- or no departments.
-- ────────────────────────────────────────────────────────────────────────────

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

  return new_company;
end;
$$;

-- Only service-role may invoke this. Callers from anon/authenticated
-- roles get a permission error — which is the correct behavior: signup
-- flows run server-side through the admin client.
-- `BYPASSRLS` on service_role lets the function see past RLS, but the
-- EXECUTE privilege is a separate Postgres concept and must be granted
-- explicitly — otherwise the admin client hits `permission denied for
-- function` on the first signup.
revoke all on function bootstrap_company(text, text, text, text) from public;
revoke all on function bootstrap_company(text, text, text, text) from anon, authenticated;
grant  execute on function bootstrap_company(text, text, text, text) to service_role;

commit;

-- OpsFluency — debug helper RPC.
--
-- Exposes what Postgres actually sees for the current session:
--   - `session_user` / `current_user` — the Postgres role the request is
--     running as (anon | authenticated | service_role | ...). If a
--     valid third-party JWT is attached, Supabase sets this to
--     `authenticated`. If the JWT is missing or rejected, it stays
--     as `anon`, which is why RLS policies keyed `to authenticated`
--     return zero rows.
--   - `auth.role()` / `auth.uid()` — Supabase's standard helpers.
--   - `jwt_sub` / `jwt_iss` — raw claims pulled from the attached JWT
--     if one was accepted; NULL otherwise.
--   - `requesting_company_id()` — the value our RLS helpers compute
--     for the current caller.
--
-- Use from the /api/debug/auth-bridge route to distinguish
-- "JWT is attached but Supabase is treating it as anon" from
-- "JWT is being accepted but our helper returns the wrong value".
--
-- This function is readable by anon + authenticated (it only reveals
-- the caller's own auth state, no tenant data).
--
-- Delete this migration once the prod bridge is green.

begin;

create or replace function debug_whoami()
returns table (
  pg_session_user        text,
  pg_current_user        text,
  auth_role              text,
  auth_uid               uuid,
  jwt_sub                text,
  jwt_iss                text,
  requesting_company_id  uuid
)
language sql
stable
as $$
  select
    session_user::text,
    current_user::text,
    auth.role()::text,
    auth.uid(),
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'iss',
    public.requesting_company_id()
$$;

grant execute on function debug_whoami() to anon, authenticated, service_role;

commit;

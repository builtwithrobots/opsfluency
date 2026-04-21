-- OpsFluency — debug helper RPC.
--
-- Exposes what Postgres actually sees for the current session, without
-- tripping type-cast errors the way auth.uid()::uuid does when the
-- caller's JWT sub is a Clerk user id like "user_3Cg..." rather than
-- a UUID. Returns JSONB so every value is just a string; no column
-- types to mismatch.
--
-- Signals to look at (run from /api/debug/auth-bridge):
--   - `auth_role`              — PostgREST role Supabase set for the
--                                request. 'authenticated' means the
--                                JWT was accepted; 'anon' means no
--                                JWT or rejected JWT.
--   - `jwt_sub` / `jwt_iss`    — claims pulled out of the attached JWT.
--   - `requesting_company_id`  — what our RLS helper returns for the
--                                current caller (NULL means the helper
--                                can't find a matching company_members
--                                row, even though the helper runs
--                                SECURITY DEFINER and bypasses RLS).
--   - `member_match_count`     — number of company_members rows where
--                                clerk_user_id = auth.jwt() ->> 'sub'.
--                                >0 means the data is there, 0 means
--                                the jwt sub doesn't match any row.
--
-- Readable by anon + authenticated. Only reveals the caller's own auth
-- state — no tenant data. Delete once the prod bridge is green.

begin;

-- Drop first — the earlier revision of this file declared
-- `returns table (...)`, and Postgres forbids changing the return
-- type of an existing function via CREATE OR REPLACE. Safe to drop
-- unconditionally; this is a debug helper with no dependents.
drop function if exists debug_whoami();

create or replace function debug_whoami()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'pg_session_user',        session_user::text,
    'pg_current_user',        current_user::text,
    'auth_role',              auth.role()::text,
    'jwt_sub',                auth.jwt() ->> 'sub',
    'jwt_iss',                auth.jwt() ->> 'iss',
    'requesting_company_id',  public.requesting_company_id()::text,
    'member_match_count', (
      select count(*)::text
      from public.company_members
      where clerk_user_id = auth.jwt() ->> 'sub'
    ),
    'settings_jwt_claims_present', (
      nullif(current_setting('request.jwt.claims', true), '') is not null
    )
  )
$$;

grant execute on function debug_whoami() to anon, authenticated, service_role;

commit;

-- Fix announcement_reads RLS: add is_super_admin() to both clauses.
-- Per architecture rules every tenant policy must include OR is_super_admin()
-- so that god-mode tooling (platform console, impersonation) can reach all rows.

drop policy if exists reads_own_rows on announcement_reads;

create policy reads_own_rows on announcement_reads
  for all to authenticated
  using (
    is_super_admin()
    or company_member_id = (
      select id from company_members
      where clerk_user_id = auth.jwt() ->> 'sub'
      limit 1
    )
  )
  with check (
    is_super_admin()
    or company_member_id = (
      select id from company_members
      where clerk_user_id = auth.jwt() ->> 'sub'
      limit 1
    )
  );

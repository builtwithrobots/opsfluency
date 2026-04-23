-- Verification script for migration 20260422000002_qr_codes.sql
-- Run this in the Supabase SQL editor (dashboard → SQL Editor).
-- Every result set should match the "expect" comment above it.

-- ── 1. Tables exist and RLS is on ────────────────────────────────
-- Expect: 2 rows — qr_codes (t) and qr_scans (t)
SELECT tablename, rowsecurity AS rls_enabled
FROM   pg_tables
WHERE  schemaname = 'public'
AND    tablename  IN ('qr_codes', 'qr_scans')
ORDER  BY tablename;

-- ── 2. qr_codes columns ──────────────────────────────────────────
-- Expect: id, company_id, target_type, target_id, target_url,
--         label, print_config, created_by, created_at
SELECT column_name, data_type, is_nullable, column_default
FROM   information_schema.columns
WHERE  table_schema = 'public'
AND    table_name   = 'qr_codes'
ORDER  BY ordinal_position;

-- ── 3. qr_scans columns ──────────────────────────────────────────
-- Expect: id, qr_code_id, company_id, scanned_by,
--         ip_hash, user_agent, scanned_at
SELECT column_name, data_type, is_nullable, column_default
FROM   information_schema.columns
WHERE  table_schema = 'public'
AND    table_name   = 'qr_scans'
ORDER  BY ordinal_position;

-- ── 4. Check constraints ──────────────────────────────────────────
-- Expect: qr_codes_target_check — the target_type/target_id/target_url
--         mutual-exclusion constraint
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM   pg_constraint
WHERE  conrelid = 'public.qr_codes'::regclass
AND    contype  = 'c';

-- ── 5. RLS policies ───────────────────────────────────────────────
-- Expect: qr_codes_company_isolation (ALL, authenticated)
--         qr_scans_company_isolation  (ALL, authenticated)
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM   pg_policies
WHERE  schemaname = 'public'
AND    tablename  IN ('qr_codes', 'qr_scans')
ORDER  BY tablename, policyname;

-- ── 6. Indexes ────────────────────────────────────────────────────
-- Expect: qr_codes_company_id_idx, qr_codes_target_id_idx (partial),
--         qr_scans_company_id_idx, qr_scans_qr_code_id_idx,
--         qr_scans_scanned_by_idx (partial)
SELECT indexname, indexdef
FROM   pg_indexes
WHERE  schemaname = 'public'
AND    tablename  IN ('qr_codes', 'qr_scans')
ORDER  BY tablename, indexname;

-- ── 7. Foreign key references ─────────────────────────────────────
-- Expect: qr_codes → companies, qr_scans → qr_codes + companies
SELECT tc.table_name, kcu.column_name,
       ccu.table_name  AS references_table,
       ccu.column_name AS references_column,
       rc.delete_rule
FROM   information_schema.table_constraints AS tc
JOIN   information_schema.key_column_usage  AS kcu
         ON tc.constraint_name = kcu.constraint_name
JOIN   information_schema.referential_constraints AS rc
         ON tc.constraint_name = rc.constraint_name
JOIN   information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = rc.unique_constraint_name
WHERE  tc.constraint_type = 'FOREIGN KEY'
AND    tc.table_name IN ('qr_codes', 'qr_scans')
ORDER  BY tc.table_name, kcu.column_name;

-- ── 8. Quick smoke-test: requesting_company_id() and is_super_admin()
--        helpers must already exist (from the init migration).
-- Expect: 2 rows — requesting_company_id and is_super_admin
SELECT routine_name, routine_type
FROM   information_schema.routines
WHERE  routine_schema = 'public'
AND    routine_name IN ('requesting_company_id', 'is_super_admin')
ORDER  BY routine_name;

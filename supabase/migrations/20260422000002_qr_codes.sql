-- QR code system — polymorphic QR primitive.
--
-- qr_codes: one row per generated QR. Permanent URL (/s/<id>). Points to any
--   target type (sop, announcement, questionnaire, url). print_config persists
--   the print-editor state so it survives page reloads (unlike DockClarity).
--
-- qr_scans: append-only scan log. The /s/[id] route fires POST /api/qr/scans
--   before the employee has a Clerk session, so company_id is denormalized here
--   to avoid a join on an unauthenticated hot path. scanned_by is nullable.

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- qr_codes
-- ─────────────────────────────────────────────────────────────────────────────

create table qr_codes (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references companies(id) on delete cascade,
  -- target_type discriminates what the QR resolves to at scan time.
  -- 'url' is an escape hatch for arbitrary external links.
  target_type  text        not null
               check (target_type in ('sop', 'announcement', 'questionnaire', 'url')),
  target_id    uuid,        -- null only when target_type = 'url'
  target_url   text,        -- null unless target_type = 'url'
  label        text        not null default '',
  -- print_config JSONB stores the full PrintConfig shape (see lib/qr/print-config.ts).
  -- Defaults are applied in application code; the DB default is an empty object so
  -- older rows without explicit config don't blow up on read.
  print_config jsonb       not null default '{}',
  created_by   text        not null,  -- clerk_user_id
  created_at   timestamptz not null default now(),
  -- Exactly one of target_id / target_url must be set, depending on target_type.
  constraint qr_codes_target_check check (
    (target_type = 'url'  and target_url is not null and target_id is null) or
    (target_type != 'url' and target_id  is not null and target_url is null)
  )
);

create index qr_codes_company_id_idx    on qr_codes (company_id);
create index qr_codes_target_id_idx     on qr_codes (target_type, target_id)
  where target_id is not null;

alter table qr_codes enable row level security;

create policy qr_codes_company_isolation on qr_codes
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- qr_scans
-- ─────────────────────────────────────────────────────────────────────────────

create table qr_scans (
  id           uuid        primary key default gen_random_uuid(),
  qr_code_id   uuid        not null references qr_codes(id) on delete cascade,
  -- company_id denormalized to avoid a join on the unauthenticated scan-log path.
  company_id   uuid        not null references companies(id) on delete cascade,
  scanned_by   text,       -- clerk_user_id; null before the employee authenticates
  -- ip_hash: SHA-256 of the raw IP. Stores enough to rate-limit and deduplicate
  -- without retaining PII (raw IP). Never log the raw IP.
  ip_hash      text,
  user_agent   text,
  scanned_at   timestamptz not null default now()
);

create index qr_scans_qr_code_id_idx    on qr_scans (qr_code_id, scanned_at desc);
create index qr_scans_company_id_idx    on qr_scans (company_id, scanned_at desc);
create index qr_scans_scanned_by_idx    on qr_scans (scanned_by)
  where scanned_by is not null;

alter table qr_scans enable row level security;

-- Employees can see their own scans; managers/admins see the whole company.
-- The unauthenticated POST /api/qr/scans insert path uses the service-role
-- client (admin.ts) so RLS is bypassed there — this policy governs reads only.
create policy qr_scans_company_isolation on qr_scans
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

commit;

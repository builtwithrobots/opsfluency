-- OpsFluency — QR archive lifecycle.
--
-- Soft-delete via `archived_at`: a QR is "in use" while archived_at is null
-- and "in the archive" once a manager moves it. Hard delete only happens
-- from the archive (DELETE /api/qr/:id), so an active QR can never be lost
-- by mistake.
--
-- A scan of an archived QR resolves to the existing 410 Gone page — the
-- /s/[id] route already renders QrGone for archived SOPs; we extend that
-- branch to honor archived_at on the QR itself in lib/qr/resolve.ts.

begin;

alter table qr_codes
  add column if not exists archived_at timestamptz;

-- Active-only filter is the dashboard hot path; partial index keeps it tight.
create index if not exists qr_codes_active_idx
  on qr_codes (company_id, created_at desc)
  where archived_at is null;

-- Archived-only filter for the archive view; same shape, complementary scope.
create index if not exists qr_codes_archived_idx
  on qr_codes (company_id, archived_at desc)
  where archived_at is not null;

commit;

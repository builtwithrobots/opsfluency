-- OpsFluency — QR scheduling window.
--
-- A custom-URL QR can carry an optional active window. Both ends are
-- nullable independently:
--   active_from  null → active immediately after creation
--   active_until null → never expires
-- both null    → "no schedule" (the default; matches today's behaviour)
--
-- A scan outside the window is treated as `archived` by the resolver
-- and renders the existing 410 Gone page. Library cards distinguish
-- "Active · Date Range" from "Inactive · Date Range" by comparing now()
-- to these columns at render time.
--
-- SOP-typed QRs ignore these columns entirely — the SOP lifecycle owns
-- their availability. The check constraint enforces no-schedule for
-- SOP rows so a stray UI bug can't accidentally schedule them.

begin;

alter table qr_codes
  add column if not exists active_from  timestamptz,
  add column if not exists active_until timestamptz;

alter table qr_codes
  drop constraint if exists qr_codes_schedule_window_check;
alter table qr_codes
  add constraint qr_codes_schedule_window_check
    check (
      active_from is null
      or active_until is null
      or active_until > active_from
    );

alter table qr_codes
  drop constraint if exists qr_codes_sop_no_schedule_check;
alter table qr_codes
  add constraint qr_codes_sop_no_schedule_check
    check (
      target_type <> 'sop'
      or (active_from is null and active_until is null)
    );

-- Tail-end index for the resolver's "is now() past the end" predicate.
-- Partial: only rows that actually have a window matter for the check.
create index if not exists qr_codes_schedule_idx
  on qr_codes (active_until)
  where active_until is not null;

commit;

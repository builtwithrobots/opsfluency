-- OpsFluency — generalise ai_call_log to track non-token providers.
--
-- The table is named for AI cost telemetry but its column names —
-- `input_tokens` / `output_tokens` — assume an LLM-shaped meter.
-- Google Cloud Translation bills per source character, not per token,
-- and we want it on the same dashboard as Sonnet / Haiku without
-- either spinning up a parallel table or stuffing character counts
-- into "token" columns and lying about it in code.
--
-- After this migration:
--   - `input_units` and `output_units` hold the meter count
--   - `unit_kind` (`'token'` | `'character'`) tells the dashboard
--     which label and which row of the price table to apply
--
-- Existing rows backfill to `unit_kind = 'token'` because every row
-- written before today came from `lib/ai/sonnet.ts`. The DEFAULT is
-- dropped immediately after the backfill — new writers must specify
-- `unit_kind` explicitly so a future provider added without thought
-- can't silently slip in as the wrong kind.

begin;

alter table ai_call_log rename column input_tokens  to input_units;
alter table ai_call_log rename column output_tokens to output_units;

alter table ai_call_log
  add column unit_kind text not null default 'token'
    check (unit_kind in ('token', 'character'));

-- Drop the default so future inserts must be explicit. Existing rows
-- have already been backfilled to 'token' by the DEFAULT above.
alter table ai_call_log alter column unit_kind drop default;

commit;

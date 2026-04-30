-- Track Anthropic prompt-cache token breakdown in ai_call_log.
--
-- The Anthropic SDK returns three distinct input-token buckets in
-- response.usage:
--   - input_tokens            total (regular + cache_creation + cache_read)
--   - cache_creation_input_tokens   tokens written to the prompt cache
--   - cache_read_input_tokens       tokens read from the prompt cache
--
-- Without this split, the dashboard prices every input token at the
-- regular rate ($3/MTok for Sonnet), overstating cost for calls where
-- the system prompt was served from cache ($0.30/MTok — 10× cheaper).
--
-- We keep `input_units` as the total (matches what the SDK surfaces as
-- the canonical count) and add two additive columns for the cache slices.
-- Cost formula after this migration:
--   regular_input = input_units - cache_write_tokens - cache_read_tokens
--   cost = regular_input * price_input
--        + cache_write_tokens * price_cache_write
--        + cache_read_tokens  * price_cache_read
--        + output_units       * price_output
--
-- Existing rows default to 0 for both columns, which is correct: they
-- were logged before caching was tracked so they pay full input rate.
-- This is a slight overstatement for historical rows but the correct
-- forward model.
--
-- Only applies to unit_kind = 'token' rows; 'character' rows (Google)
-- will always have 0 in both columns.

begin;

alter table ai_call_log
  add column cache_write_tokens integer not null default 0,
  add column cache_read_tokens  integer not null default 0;

commit;

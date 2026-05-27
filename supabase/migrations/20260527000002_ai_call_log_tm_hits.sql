-- Add tm_hits to ai_call_log to track translation memory cache performance.
--
-- For Google Translate calls: tm_hits = number of text segments served from the
-- TM cache (not sent to Google). A partial hit logs actual chars sent to Google
-- in input_units and the hit count in tm_hits. A full hit logs input_units = 0
-- and tm_hits = N.
--
-- Existing rows default to 0, which is correct — they predate TM integration.
-- Anthropic token rows always have tm_hits = 0 (TM is not used for LLM calls).
--
-- Usage on the platform AI console:
--   TM hit rate: sum(tm_hits) over a period shows segments served from cache.
--   Savings estimate: each tm_hit represents a ~50-char average segment saved
--   from Google billing (~$0.001 each at $20/M chars — approximate).

begin;

alter table ai_call_log
  add column tm_hits integer not null default 0;

comment on column ai_call_log.tm_hits is
  'Number of text segments served from translation_memory cache (not billed to Google). '
  'Always 0 for Anthropic token rows.';

commit;

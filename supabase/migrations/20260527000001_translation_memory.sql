-- Translation Memory: per-company cache of source → translated text segments.
--
-- Before calling Google Translate, qualifying text segments (≥ 20 chars) are
-- looked up here. A hit costs $0; a miss goes to Google and is saved back here
-- for future reuse.
--
-- Keyed by (company_id, content_hash, language_code) so each tenant builds an
-- independent TM. Cross-tenant sharing is not supported — it would be a
-- security boundary violation.
--
-- source values:
--   'google'       — auto-saved from a successful Google Translate call.
--   'manager_edit' — manager corrected the Spanish directly (higher trust;
--                    application layer prefers these on lookup).
--
-- Glossary-change caveat: TM entries store the fully-restored translation
-- (glossary placeholders already substituted back). If a glossary term's
-- Spanish definition is updated after a TM entry is saved, that entry will
-- return the old Spanish term until it is manually cleared or re-translated.
-- Acceptable for MVP — glossary definitions are stable once a company is set up.

begin;

create table translation_memory (
  id              uuid        primary key default gen_random_uuid(),
  company_id      uuid        not null references companies(id) on delete cascade,
  content_hash    text        not null,   -- SHA-256 of original source text (pre-substitution)
  source_text     text        not null,
  translated_text text        not null,
  language_code   text        not null default 'es',
  source          text        not null default 'google'
                  check (source in ('google', 'manager_edit')),
  approved_at     timestamptz,            -- future: manager-approval flow
  created_at      timestamptz not null default now(),
  unique (company_id, content_hash, language_code)
);

-- Primary lookup pattern: given company + language, find a set of hashes.
create index translation_memory_lookup_idx
  on translation_memory (company_id, language_code, content_hash);

-- RLS: tenant isolation.
alter table translation_memory enable row level security;

create policy translation_memory_company_isolation on translation_memory
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

-- Service role (admin client) bypasses RLS for the async save path.
-- No extra grant needed — admin client holds the service role which is exempt.

comment on table translation_memory is
  'Per-company cache of approved EN→{lang} text segment translations. '
  'Keyed by SHA-256 of source text. Checked before every Google Translate call '
  'to eliminate redundant spend on repeated or shared content.';

commit;

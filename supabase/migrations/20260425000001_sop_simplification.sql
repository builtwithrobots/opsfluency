-- OpsFluency — SOP MVP simplification.
--
-- Strips authoring concerns from the SOP flow and lands the missing pieces
-- needed for the upload → convert → flag → translate → approve → QR loop:
--
--  1. `sops.template` becomes nullable. The four templates are not exposed
--     in the UI any more (see `app/dashboard/sops`); the column survives so
--     historical rows stay valid and Phase 2 can re-introduce templates if
--     a real customer need shows up.
--  2. `glossary_terms` table — company-scoped EN/ES vocabulary, injected
--     into Sonnet conversion and Google translation. Definitions arrive
--     from the SOP terms gate when a manager confirms a flagged term.
--  3. `company_members.preferred_language` — the worker's reader-side
--     language toggle persists here. CLAUDE.md hypothesised an
--     `employees` table but the multi-tenancy spine already keys workers
--     by `company_members`, so the simpler model is to extend it.
--  4. `sop-uploads` private storage bucket — referenced by the upload
--     dropzone. MIME enforcement happens in application code (see
--     `SOP_UPLOAD_MIME_TYPES` in `lib/types/sop.ts`).

begin;

-- ── 1. Relax sops.template ────────────────────────────────────────────────────

alter table sops alter column template drop not null;

-- ── 2. glossary_terms ─────────────────────────────────────────────────────────

create table if not exists glossary_terms (
  id              uuid        primary key default gen_random_uuid(),
  company_id      uuid        not null references companies(id) on delete cascade,
  term_en         text        not null check (char_length(term_en) between 1 and 200),
  definition_en   text                 check (definition_en is null or char_length(definition_en) <= 2000),
  term_es         text        not null check (char_length(term_es) between 1 and 200),
  definition_es   text                 check (definition_es is null or char_length(definition_es) <= 2000),
  created_by      text        not null,  -- clerk_user_id
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Same English term twice in one company would shadow itself in glossary
  -- injection. Case-insensitive uniqueness is enforced by the index below.
  unique (company_id, term_en)
);

create unique index if not exists glossary_terms_company_term_lower_idx
  on glossary_terms (company_id, lower(term_en));

create index if not exists glossary_terms_company_id_idx
  on glossary_terms (company_id);

-- Reuse the existing trigger function from migration 003.
create trigger glossary_terms_set_updated_at
  before update on glossary_terms
  for each row execute function set_updated_at();

alter table glossary_terms enable row level security;

create policy glossary_terms_company_isolation on glossary_terms
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

-- ── 3. preferred_language on company_members ─────────────────────────────────

alter table company_members
  add column if not exists preferred_language text not null default 'en'
    check (preferred_language in ('en', 'es'));

-- ── 4. sop-uploads private storage bucket ────────────────────────────────────

-- Bucket lives in the storage schema. Insert is idempotent — re-running this
-- migration won't duplicate the row. The bucket holds the original uploaded
-- documents at path `${company_id}/${sop_id}/v${version_number}/${filename}`;
-- managers see them via short-lived signed URLs (1 hour).
insert into storage.buckets (id, name, public)
values ('sop-uploads', 'sop-uploads', false)
on conflict (id) do nothing;

-- RLS on storage.objects for sop-uploads:
--  - authenticated users can read/write only inside their own company prefix
--  - super admins pass via is_super_admin() (god mode)
-- The first path segment is the company_id (uuid as text).

drop policy if exists "sop_uploads_company_isolation_select" on storage.objects;
drop policy if exists "sop_uploads_company_isolation_insert" on storage.objects;
drop policy if exists "sop_uploads_company_isolation_update" on storage.objects;
drop policy if exists "sop_uploads_company_isolation_delete" on storage.objects;

create policy "sop_uploads_company_isolation_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'sop-uploads'
    and (
      (storage.foldername(name))[1] = requesting_company_id()::text
      or is_super_admin()
    )
  );

create policy "sop_uploads_company_isolation_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'sop-uploads'
    and (
      (storage.foldername(name))[1] = requesting_company_id()::text
      or is_super_admin()
    )
  );

create policy "sop_uploads_company_isolation_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'sop-uploads'
    and (
      (storage.foldername(name))[1] = requesting_company_id()::text
      or is_super_admin()
    )
  );

create policy "sop_uploads_company_isolation_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'sop-uploads'
    and (
      (storage.foldername(name))[1] = requesting_company_id()::text
      or is_super_admin()
    )
  );

commit;

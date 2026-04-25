-- OpsFluency — super-admin destructive-action audit log.
--
-- Mirrors `impersonation_events` in shape and access policy, but
-- generalised for any cross-tenant god-mode action a super admin
-- performs from the platform console (or from any page where a
-- super-admin-only affordance lights up). The first user is the
-- per-SOP hard delete on /dashboard/sops/[id]; future destructive
-- actions slot in via the (action, subject_type, subject_id) tuple.
--
-- Like `impersonation_events`, this table is locked at grant level
-- (`revoke all from anon, authenticated`). The application writes via
-- the service-role admin client only, so the standard tenant RLS
-- policies don't need to know about it. A super-admin-only audit UI
-- (Phase 2) will read through a SECURITY DEFINER helper.

begin;

create table super_admin_events (
  id                          uuid         primary key default gen_random_uuid(),
  super_admin_clerk_user_id   text         not null,
  -- Free-form action verb. Examples: 'sop.hard_delete', 'tenant.purge'.
  -- Namespaced so a future read UI can group by subject area.
  action                      text         not null,
  -- The kind of thing being acted on (`sop`, `tenant`, `user`, etc.).
  subject_type                text         not null,
  -- The id of the thing being acted on. Stored as uuid because every
  -- subject we'd plausibly act on (sops, companies, sop_versions,
  -- glossary_terms, super_admins) is uuid-keyed.
  subject_id                  uuid         not null,
  -- Owning tenant when applicable. `on delete set null` keeps the audit
  -- row alive even if the tenant is later purged — the metadata column
  -- still has whatever context we captured at the moment of action.
  company_id                  uuid                  references companies(id) on delete set null,
  -- Per-action context (counts of cascaded rows, original title, etc).
  -- Avoid PII; this table outlives the rows it describes.
  metadata                    jsonb,
  occurred_at                 timestamptz  not null default now()
);

create index super_admin_events_super_admin_idx
  on super_admin_events (super_admin_clerk_user_id, occurred_at desc);

create index super_admin_events_subject_idx
  on super_admin_events (subject_type, subject_id);

create index super_admin_events_company_idx
  on super_admin_events (company_id, occurred_at desc)
  where company_id is not null;

revoke all on table super_admin_events from anon, authenticated;

commit;

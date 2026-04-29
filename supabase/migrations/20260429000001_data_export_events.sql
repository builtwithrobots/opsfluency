-- OpsFluency — data export audit log.
--
-- Every export triggered from the Org Settings → Exports tab writes one row.
-- Provides a tamper-resistant record of who exported what and when, which
-- supports the customer-facing claim: "every export is logged."
--
-- Access model matches impersonation_events:
--   - Revoked from anon and authenticated (no RLS policy needed)
--   - Written exclusively via the service-role admin client
--   - Read by the ExportsTab server component via the admin client
--
-- ip_hash: SHA-256 of the exporting admin's IP. Consistent with the qr_scans
-- convention — retains enough for abuse investigation without storing raw PII.

begin;

create table data_export_events (
  id            uuid        primary key default gen_random_uuid(),
  company_id    uuid        not null references companies(id) on delete cascade,
  exported_by   text        not null,   -- clerk_user_id of the triggering admin
  format        text        not null
                            check (format in ('xlsx', 'json', 'csv_sops', 'csv_glossary', 'csv_team')),
  entity_scope  text        not null,   -- 'full' | 'sops' | 'glossary' | 'team'
  row_count     integer,               -- total rows in the export; null on assembly error
  ip_hash       text,                  -- SHA-256 of x-forwarded-for, may be null in dev
  exported_at   timestamptz not null default now()
);

create index data_export_events_company_idx
  on data_export_events (company_id, exported_at desc);

create index data_export_events_exporter_idx
  on data_export_events (exported_by, exported_at desc);

-- Lock at grant level — end-user sessions (anon + authenticated roles) cannot
-- read or write this table at all. The ExportsTab reads recent rows via the
-- admin client; the route handler writes via the admin client.
revoke all on table data_export_events from anon, authenticated;

commit;

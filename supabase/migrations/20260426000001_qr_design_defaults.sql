-- Org-wide QR print design defaults.
--
-- Adds companies.qr_design_defaults JSONB. The shape is a Partial<PrintConfig>
-- (see lib/qr/print-config.ts) — we don't validate the shape in the database
-- because it evolves with the application. The Server-side defaultPrintConfig()
-- helper merges company defaults + per-target template defaults + per-call
-- overrides, so any missing key falls through to BASE_PRINT_CONFIG.
--
-- Default '{}' (not NULL) so reads never need to coalesce.

begin;

alter table companies
  add column qr_design_defaults jsonb not null default '{}'::jsonb;

commit;

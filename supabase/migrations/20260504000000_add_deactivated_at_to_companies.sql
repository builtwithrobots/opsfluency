-- Soft-deactivation for tenants.
--
-- Instead of hard-deleting a company (which would cascade-destroy all
-- ai_call_log, sop_scans, and sop_versions rows we need for historical
-- reporting), super admins now deactivate a tenant. Deactivation:
--   • sets companies.deactivated_at to NOW()
--   • blocks every company member from loading the dashboard or PWA
--     (getCompanyContext throws COMPANY_DEACTIVATED)
--   • preserves all data intact for cross-tenant analytics
--
-- Reactivation simply clears deactivated_at back to NULL.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

COMMENT ON COLUMN companies.deactivated_at IS
  'NULL = active. Non-null = super-admin deactivated this tenant. All data '
  'is preserved; members cannot log in until reactivated.';

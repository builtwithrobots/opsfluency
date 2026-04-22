-- OpsFluency — super-admin impersonation audit log.
--
-- Super admins can temporarily "wear" a tenant's admin hat via a signed
-- cookie issued from the Platform → Tenants page. Every start and stop
-- of an impersonation session writes one row here so we always have a
-- paper trail of who accessed whose data and when.
--
-- The table is locked at grant level — the app writes via the service
-- role client only, and reads (when a super-admin audit UI lands) will
-- go through a SECURITY DEFINER helper. Keeps the tenant-scoped anon /
-- authenticated roles completely away from it.

begin;

create table impersonation_events (
  id                          uuid         primary key default gen_random_uuid(),
  super_admin_clerk_user_id   text         not null,
  company_id                  uuid         not null references companies(id) on delete cascade,
  action                      text         not null check (action in ('start', 'stop')),
  occurred_at                 timestamptz  not null default now()
);

create index impersonation_events_super_admin_idx on impersonation_events(super_admin_clerk_user_id, occurred_at desc);
create index impersonation_events_company_idx     on impersonation_events(company_id, occurred_at desc);

revoke all on table impersonation_events from anon, authenticated;

commit;

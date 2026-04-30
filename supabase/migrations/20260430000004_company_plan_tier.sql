-- Add plan_tier to companies so the super-admin AI usage console can
-- compare each tenant's AI spend against the concern threshold for their
-- subscription tier (20% of monthly plan price, per docs/pricing.md).
--
-- Billing is not yet self-serve — the column is set manually by a super
-- admin via the platform console until Stripe/Paddle integration lands.
-- All existing tenants default to 'starter' and should be corrected once
-- billing infrastructure is wired.

begin;

alter table companies
  add column plan_tier text not null default 'starter'
    check (plan_tier in ('starter', 'growth', 'scale', 'enterprise'));

commit;

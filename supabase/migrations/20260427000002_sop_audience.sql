-- OpsFluency — SOP audience targeting (document control).
--
-- Mirrors the QR code audience model: each SOP carries a list of
-- department ids + roles that gate who can see it on the worker app,
-- in search, and on scan. ISO / quality regulation requires explicit
-- doc control, so going forward every newly-uploaded SOP must declare
-- a non-empty audience (enforced at the application layer — the column
-- defaults stay `'{}'` so existing rows don't violate any constraint).
--
-- Existing SOPs are backfilled to "visible to the owning department"
-- — the most conservative interpretation of "doc control was always
-- on, we just hadn't named it." Managers can widen it later from the
-- new Audience tab on each SOP.

begin;

alter table sops
  add column if not exists audience_department_ids uuid[] not null default '{}',
  add column if not exists audience_roles          text[] not null default '{}';

-- Constrain audience_roles to legal role values. Same pattern + same
-- error surface as qr_codes_audience_roles_check.
alter table sops
  drop constraint if exists sops_audience_roles_check;
alter table sops
  add constraint sops_audience_roles_check
    check (audience_roles <@ array['admin','manager','employee']::text[]);

-- Backfill existing rows: copy the owning department into the audience
-- so today's SOPs don't suddenly become invisible to anyone. Idempotent
-- — only writes rows whose audience hasn't been set yet.
update sops
   set audience_department_ids = array[department_id]
 where department_id is not null
   and audience_department_ids = '{}';

-- GIN indexes back the worker-app feed query: "SOPs whose
-- audience_department_ids overlap any of the worker's department ids,
-- or whose audience_roles contains the worker's role." Both axes use
-- the && (overlap) operator at scan time.
create index if not exists sops_audience_dept_ids_idx
  on sops using gin (audience_department_ids);
create index if not exists sops_audience_roles_idx
  on sops using gin (audience_roles);

commit;

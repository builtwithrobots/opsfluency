-- OpsFluency — departments: replace color_key with color_hex for arbitrary hex support,
-- add sort_order for manager-controlled ordering, and drop the icon_key CHECK constraint
-- so additional icons can be added without further schema changes.
--
-- color_key column is retained for backward compatibility but is no longer written by
-- the app after this migration. color_hex is the canonical display field.

begin;

-- ── 1. Drop old CHECK constraints ─────────────────────────────────────────────

alter table departments
  drop constraint if exists departments_color_key_check,
  drop constraint if exists departments_icon_key_check;

-- ── 2. Add color_hex ──────────────────────────────────────────────────────────

alter table departments
  add column if not exists color_hex text;

-- Backfill from existing color_key values using Tailwind-500 hex equivalents
update departments set color_hex = case color_key
  when 'sky'     then '#0ea5e9'
  when 'emerald' then '#10b981'
  when 'amber'   then '#f59e0b'
  when 'violet'  then '#8b5cf6'
  when 'rose'    then '#f43f5e'
  when 'orange'  then '#f97316'
  when 'teal'    then '#14b8a6'
  when 'indigo'  then '#6366f1'
  when 'yellow'  then '#facc15'
  else                '#a1a1aa'  -- zinc / any unknown key
end
where color_hex is null;

alter table departments
  alter column color_hex set not null,
  alter column color_hex set default '#a1a1aa';

-- ── 3. Add sort_order ─────────────────────────────────────────────────────────

alter table departments
  add column if not exists sort_order integer;

-- Assign sequential order per company, alphabetical by name as the initial ordering
with ordered as (
  select id,
         (row_number() over (partition by company_id order by name) - 1)::integer as rn
  from departments
)
update departments d
set sort_order = o.rn
from ordered o
where d.id = o.id
  and d.sort_order is null;

alter table departments
  alter column sort_order set not null,
  alter column sort_order set default 0;

commit;

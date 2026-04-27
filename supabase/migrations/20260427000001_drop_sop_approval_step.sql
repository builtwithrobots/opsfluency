-- OpsFluency — retire the SOP "approve" pipeline step.
--
-- Translation now auto-publishes (runTranslation transitions straight from
-- pending_translation → published and generates the QR), so any row sitting
-- in `pending_approval` from before this change has no UI path forward.
--
-- Promote them in place: the latest version's content_es is already populated
-- (that was the gate that put the row into pending_approval in the first
-- place), so the only work needed is the status flip + a published_at stamp
-- + a SOP QR row if one doesn't exist yet.
--
-- The `pending_approval` value stays in the status CHECK constraint to keep
-- this migration small and reversible. It just becomes a value no app code
-- writes anymore.

begin;

-- 1. Stamp published_at on the latest version of every stuck SOP (only if
--    that version doesn't already have one — safe re-run).
update sop_versions sv
   set published_at = now()
  from (
    select distinct on (sop_id) sop_id, id
      from sop_versions
     order by sop_id, version_number desc
  ) latest
 where sv.id = latest.id
   and sv.published_at is null
   and exists (
     select 1
       from sops s
      where s.id = sv.sop_id
        and s.status = 'pending_approval'
   );

-- 2. Generate a permanent SOP QR for every stuck SOP that doesn't have one.
--    print_config defaults to '{}'; the app fills the real config when the
--    print editor is first opened. created_by = SOP creator so audit stays
--    intact (rather than NULL).
insert into qr_codes (company_id, target_type, target_id, label, created_by)
select s.company_id, 'sop', s.id, coalesce(s.title, ''), s.created_by
  from sops s
 where s.status = 'pending_approval'
   and not exists (
     select 1
       from qr_codes q
      where q.target_type = 'sop'
        and q.target_id = s.id
   );

-- 3. Flip the status itself.
update sops
   set status = 'published'
 where status = 'pending_approval';

commit;

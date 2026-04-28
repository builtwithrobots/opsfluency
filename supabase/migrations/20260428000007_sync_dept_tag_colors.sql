-- Sync department-sourced tag colors to match their parent department's
-- color_hex. Future syncs happen in the updateDepartment server action.
-- Only affects tags with source = 'department' (Process and Equipment were
-- already unlocked to 'custom' in migration 000006).

UPDATE public.tags t
SET    color = d.color_hex
FROM   public.departments d
WHERE  t.department_id = d.id
  AND  t.source        = 'department';

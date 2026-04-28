-- Re-link the Warehouse tag to its department and restore source = 'department'.
-- The tag was previously left as source = 'custom' after account setup.
-- Matches on name_en = 'Warehouse' across every company that has both a
-- Warehouse department and a custom Warehouse tag.

UPDATE public.tags t
SET
  source        = 'department',
  department_id = d.id,
  color         = d.color_hex
FROM public.departments d
WHERE d.company_id  = t.company_id
  AND d.name        = 'Warehouse'
  AND t.name_en     = 'Warehouse'
  AND t.source      = 'custom';

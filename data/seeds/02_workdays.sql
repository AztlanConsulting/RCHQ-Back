-- Workday catalog (name max 9 chars per schema)
-- Run after migration

BEGIN;

INSERT INTO public.workday (workday_id, name)
VALUES
  ('c0000001-0000-4000-8000-000000000001', 'Lunes'),
  ('c0000001-0000-4000-8000-000000000002', 'Martes'),
  ('c0000001-0000-4000-8000-000000000003', 'Miércoles'),
  ('c0000001-0000-4000-8000-000000000004', 'Jueves'),
  ('c0000001-0000-4000-8000-000000000005', 'Viernes'),
  ('c0000001-0000-4000-8000-000000000006', 'Sábado'),
  ('c0000001-0000-4000-8000-000000000007', 'Domingo')
ON CONFLICT (workday_id) DO UPDATE SET
  name = EXCLUDED.name;

COMMIT;

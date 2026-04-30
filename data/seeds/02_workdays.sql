-- Workday catalog (name max 9 chars per schema)
-- Run after migration

BEGIN;

INSERT INTO public.workday (workday_id, name)
VALUES
  ('c0000001-0000-4000-8000-000000000001', 'Lun - Vie'),
  ('c0000002-0000-4000-8000-000000000002', 'Sab - Dom')
ON CONFLICT (workday_id) DO UPDATE SET
  name = EXCLUDED.name;

COMMIT;

-- Reusable fault records; linked to employees in 04_employee_relations.sql

BEGIN;

INSERT INTO public.fault (fault_id, date, description)
VALUES
  (
    'd0000001-0000-4000-8000-000000000001',
    CURRENT_DATE - INTERVAL '12 days',
    'Retraso a reunión de equipo (15 min)'
  ),
  (
    'd0000002-0000-4000-8000-000000000002',
    CURRENT_DATE - INTERVAL '45 days',
    'Falta justificada con certificado médico'
  )
ON CONFLICT (fault_id) DO UPDATE SET
  date = EXCLUDED.date,
  description = EXCLUDED.description;

COMMIT;

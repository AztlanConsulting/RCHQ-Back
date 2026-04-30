-- Depends on: 20260423_employee_end_date_phone_address.sql (migration)
-- Idempotent: upserts fixed house ids

BEGIN;

INSERT INTO public.house (
  house_id,
  name,
  location,
  phone_number,
  description,
  image
)
VALUES (
  'a0000001-0000-4000-8000-000000000001',
  'Desarrollo',
  'Campus Monterrey, Av. Eugenio Garza Sada 2501, Monterrey',
  '524424792232',
  'Casa de desarrollo y pruebas del sistema',
  'https://placehold.co/100x100/e2e8f0/64748b?text=Dev'
)
ON CONFLICT (house_id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  phone_number = EXCLUDED.phone_number,
  description = EXCLUDED.description,
  image = EXCLUDED.image;

INSERT INTO public.house (
  house_id,
  name,
  location,
  phone_number,
  description,
  image
)
VALUES (
  'b0000001-0000-4000-8000-000000000001',
  'Operaciones CDMX',
  'Insurgentes Sur 1000, Ciudad de México',
  '525555100200',
  'Casa de operaciones central',
  'https://placehold.co/100x100/dbeafe/1e40af?text=OP'
)
ON CONFLICT (house_id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  phone_number = EXCLUDED.phone_number,
  description = EXCLUDED.description,
  image = EXCLUDED.image;

COMMIT;

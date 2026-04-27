-- Depends on: 01_houses.sql, 02_workdays.sql, 03_faults.sql
-- Updates first employee (by email), inserts second employee, addresses, faults links, workdays, vacations
-- Re-uses the bcrypt hash from data/seed.sql (same test password) for the new user

BEGIN;

-- Fixed second employee (avoid duplicate on re-run)
-- Replace CURP/ email if you already have conflicts

INSERT INTO public.employee (
  employee_id,
  house_id,
  role_id,
  name,
  surname,
  is_active,
  email,
  password,
  has_first_login,
  is_active_2fa,
  failed_login_attempts,
  failed_2fa_attempts,
  totp_secret,
  curp,
  rfc,
  birth_date,
  picture,
  start_date,
  end_date,
  phone_number,
  nss,
  bank_account
)
SELECT
  'e0000001-0000-4000-8000-000000000001',
  'b0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'admin' LIMIT 1),
  'María',
  'González',
  true,
  'maria.operaciones@example.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  true,
  false,
  0,
  0,
  NULL,
  'GAMR850101MDFNPL08',
  NULL,
  '1985-01-15',
  NULL,
  '2025-01-20',
  NULL,
  '+52 55 5555 1002',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.employee WHERE employee_id = 'e0000001-0000-4000-8000-000000000001'
);

-- Enrich / align first user (keeps existing id; fills phone and optional end_date)
UPDATE public.employee
SET
  house_id = COALESCE(
    (SELECT house_id FROM public.house WHERE house_id = 'a0000001-0000-4000-8000-000000000001'),
    house_id
  ),
  phone_number = COALESCE(phone_number, '+52 442 479 2232')
WHERE email = 'andre@gmail.com';

-- employee_address: one row per user (idempotent on fixed UUIDs)

INSERT INTO public.employee_address (
  employee_address_id,
  employee_id,
  url,
  street,
  municipio,
  city,
  postal_code,
  date
)
VALUES (
  'f0000001-0000-4000-8000-000000000001',
  'e0000001-0000-4000-8000-000000000001',
  'https://maps.google.com/?q=19.4300,-99.2011',
  'Av. Insurgentes Sur 1000',
  'Benito Juárez',
  'Ciudad de México',
  '03100',
  NOW()
)
ON CONFLICT (employee_address_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  url = EXCLUDED.url,
  street = EXCLUDED.street,
  municipio = EXCLUDED.municipio,
  city = EXCLUDED.city,
  postal_code = EXCLUDED.postal_code,
  date = EXCLUDED.date;

INSERT INTO public.employee_address (
  employee_address_id,
  employee_id,
  url,
  street,
  municipio,
  city,
  postal_code,
  date
)
SELECT
  'f0000002-0000-4000-8000-000000000002',
  e.employee_id,
  'https://maps.google.com/?q=25.6516,-100.2890',
  'Av. Eugenio Garza Sada 2501',
  'Monterrey',
  'Monterrey',
  '64850',
  NOW()
FROM public.employee e
WHERE e.email = 'andre@gmail.com'
ON CONFLICT (employee_address_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  url = EXCLUDED.url,
  street = EXCLUDED.street,
  municipio = EXCLUDED.municipio,
  city = EXCLUDED.city,
  postal_code = EXCLUDED.postal_code,
  date = EXCLUDED.date;

-- employee ↔ fault

INSERT INTO public.employee_fault (fault_id, employee_id)
SELECT 'd0000001-0000-4000-8000-000000000001', e.employee_id
FROM public.employee e
WHERE e.email = 'andre@gmail.com'
ON CONFLICT (fault_id, employee_id) DO NOTHING;

INSERT INTO public.employee_fault (fault_id, employee_id)
SELECT 'd0000002-0000-4000-8000-000000000002', e.employee_id
FROM public.employee e
WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (fault_id, employee_id) DO NOTHING;

-- workday schedules (Lun-Vie 9–18, second user weekend pattern sample)

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT
  'c0000001-0000-4000-8000-000000000001',
  e.employee_id,
  '09:00:00',
  '18:00:00'
FROM public.employee e
WHERE e.email = 'andre@gmail.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET
  start = EXCLUDED.start,
  "end" = EXCLUDED."end";

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT
  'c0000001-0000-4000-8000-000000000001',
  e.employee_id,
  '10:00:00',
  '19:00:00'
FROM public.employee e
WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET
  start = EXCLUDED.start,
  "end" = EXCLUDED."end";

-- vacations (status: 0 pending, 1 approved — adjust to your app convention)
-- IDs: gen_random_uuid() (literals like v0000… are invalid: UUIDs are hex only)

INSERT INTO public.vacations_request (
  vacations_request_id,
  employee_id,
  start,
  "end",
  status,
  feedback
)
SELECT
  gen_random_uuid(),
  e.employee_id,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  (CURRENT_DATE + INTERVAL '37 days')::date,
  1,
  'Aprobado por RRHH'
FROM public.employee e
WHERE e.email = 'andre@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM public.vacations_request vr
    WHERE vr.employee_id = e.employee_id
      AND vr.start = (CURRENT_DATE + INTERVAL '30 days')::date
  );

INSERT INTO public.vacations_request (
  vacations_request_id,
  employee_id,
  start,
  "end",
  status,
  feedback
)
SELECT
  gen_random_uuid(),
  e.employee_id,
  (CURRENT_DATE + INTERVAL '60 days')::date,
  (CURRENT_DATE + INTERVAL '64 days')::date,
  0,
  NULL
FROM public.employee e
WHERE e.email = 'maria.operaciones@example.com'
  AND NOT EXISTS (
    SELECT 1
    FROM public.vacations_request vr
    WHERE vr.employee_id = e.employee_id
      AND vr.start = (CURRENT_DATE + INTERVAL '60 days')::date
  );

COMMIT;

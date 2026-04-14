-- Minimal seed: one house, one role, one employee
-- Login: dev@example.com / 123
-- Re-run safe

BEGIN;


DELETE FROM public.employee WHERE employee_id = 'a0000003-0000-4000-8000-000000000003';
DELETE FROM public.house WHERE house_id = 'a0000001-0000-4000-8000-000000000001';
DELETE FROM public.role WHERE role_id = 'a0000002-0000-4000-8000-000000000002';

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
  'Tec de Monterrey',
  '4424792232',
  'Casa de desarrollo',
  'boop'
);

INSERT INTO public.role (
  role_id,
  name
)
VALUES (
  'a0000002-0000-4000-8000-000000000002',
  'admin'
);

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
  failed_login_attempts,
  totp_secret,
  curp,
  rfc,
  birth_date,
  picture,
  start_date,
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at
)
VALUES (
  'a0000003-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000001',
  'a0000002-0000-4000-8000-000000000002',
  'Andre',
  'Agle',
  true,
  'dev@example.com',
  '$2b$10$rq5m7kAMRGBWuGwdAEo/3eoIqIBFFihEhAjE/0tTjl3EmUctsE7E6',
  true,
  0,
  NULL,
  'XAXX010101HDFXXX01',
  NULL,
  '2003-10-04',
  'boop',
  '2026-04-09',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
);

COMMIT;
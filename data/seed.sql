-- Minimal seed: one house, one role, one employee
-- Login: andre@gmail.com / Andatti67
-- Re-run safe

-- =========================
-- CATÁLOGOS
-- =========================


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
  gen_random_uuid(),
  (SELECT house_id FROM house LIMIT 1),
  (SELECT role_id FROM role LIMIT 1),
  'Carlos',
  'Ramírez',
  true,
  'andre@gmail.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
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

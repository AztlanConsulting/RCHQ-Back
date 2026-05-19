INSERT INTO public.employee (
    employee_id, house_id, role_id, name, surname,
    is_active, email, password, has_first_login,
    failed_login_attempts, totp_secret, curp, rfc,
    birth_date, picture, start_date, nss, bank_account,
    blocked_until, temp_totp_secret, temp_totp_secret_created_at,
    type
)
VALUES (
  'b8f54b14-701e-4e87-a019-caef53dcda67',
  (SELECT house_id FROM public.house  WHERE name = 'Senderos I.A.P' LIMIT 1),
  (SELECT role_id  FROM public.role   WHERE name = 'Psicólogo'      LIMIT 1),
  'Andre',
  'Agle',
  true,
  'andre2@gmail.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  0,
  NULL,
  'XAXX010101HDFXXX02',
  NULL,
  '2003-10-04',
  'boop',
  '2026-04-09',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'honorario'
), (
  'b8f54b14-701e-4e87-a019-caef53dcda68',
  (SELECT house_id FROM public.house  WHERE name = 'Casa de Jesús' LIMIT 1),
  (SELECT role_id  FROM public.role   WHERE name = 'Chofer'      LIMIT 1),
  'Manuel',
  'Bajos',
  true,
  'manuel@gmail.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  0,
  NULL,
  'XAXX010101HDFXXX03',
  NULL,
  '2005-06-07',
  'boop',
  '2026-02-28',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  'b8f54b14-701e-4e87-a019-caef53dcda69',
  (SELECT house_id FROM public.house  WHERE name = 'Ammi casa infantil' LIMIT 1),
  (SELECT role_id  FROM public.role   WHERE name = 'Trabajador Social'      LIMIT 1),
  'Edmundo',
  'Canedo',
  true,
  'edmundo@gmail.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  0,
  NULL,
  'XAXX010101HDFXXX04',
  NULL,
  '2005-04-16',
  'boop',
  '2026-04-09',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'asalariado'
)
ON CONFLICT DO NOTHING;

UPDATE public.employee
SET house_id = (
  SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1
)
WHERE employee_id IN (
  'b8f54b14-701e-4e87-a019-caef53dcda67',
  'b8f54b14-701e-4e87-a019-caef53dcda68',
  'b8f54b14-701e-4e87-a019-caef53dcda69'
);


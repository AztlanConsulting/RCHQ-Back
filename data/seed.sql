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

INSERT INTO public.action (action_id, description, important) VALUES
('auth-001', 'Intento fallido de autenticación', false),
('auth-002', 'Cuenta bloqueada temporalmente por múltiples intentos fallidos', false),
('auth-003', 'Inicio de sesión exitoso', false),
('auth-004', 'Primer acceso validado, pendiente cambio de contraseña', false),
('auth-005', 'Cambio de contraseña en primer acceso', false),
('auth-006', 'Inicio de sesión completado después de cambio de contraseña en primer acceso', false),
('auth-007', 'Activación exitosa de 2FA', false),
('auth-008', 'Activación fallida de 2FA', false),
('auth-009', 'Fallo de autenticación 2FA', false),
('auth-010', 'Inicio de sesión exitoso con 2FA', false),
('auth-011', 'Desactivación exitosa de 2FA', false),
('auth-012', 'Intento de acceso denegado: usuario inactivo', false),
('auth-013', 'Intento de cambio de contraseña en primer acceso para usuario inactivo', false),
('auth-014', 'Intento de configuración de 2FA para usuario inactivo', false),
('auth-015', 'Intento de verificación 2FA para usuario inactivo', false),
('auth-016', 'Intento de validación de 2FA para usuario inactivo', false),
('auth-017', 'Intento de desactivación de 2FA para usuario inactivo', false),
('auth-018', 'Fallo de desactivación de 2FA por contraseña incorrecta', false),
('auth-019', '2FA bloqueado temporalmente por múltiples intentos fallidos', false),
('empl-001', 'Empleado creado con exito', false),
('auth-020', 'Cambio de contraseña exitoso', false),
('auth-021', 'Intento de cambio de contraseña para usuario inactivo', false),
('auth-022', 'Fallo de cambio de contraseña por contraseña actual incorrecta', false),
('vac-001', 'Creación de solicitud de vacaciones exitosa', false);

INSERT INTO public.workday (workday_id, name) VALUES
('a0000003-0000-4000-8000-000580000000', 'Lunes'),
('a0000003-0000-4000-8000-000000580001', 'Martes'),
('a0000003-0000-4000-8000-000580000002', 'Miércoles'),
('a0000003-0000-4000-8000-000000580003', 'Jueves'),
('a0000003-0000-4000-8000-000580000004', 'Viernes'),
('a0000003-0000-4000-8000-000005800005', 'Sábado'),
('a0000003-0000-4000-8000-000058000006', 'Domingo');

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end") VALUES
('a0000003-0000-4000-8000-000580000000', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00'),
('a0000003-0000-4000-8000-000000580001', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00'),
('a0000003-0000-4000-8000-000580000002', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00'),
('a0000003-0000-4000-8000-000000580003', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00'),
('a0000003-0000-4000-8000-000580000004', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00');

INSERT INTO public.event_type (event_type_id, name)
VALUES
('b1000000-0000-4000-8000-000000000001', 'General')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.global_event (
  global_event_id,
  event_type_id,
  date,
  start,
  "end",
  name,
  description,
  is_free_day
)
VALUES (
  'c1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  '2026-05-01',
  '09:00:00',
  '17:00:00',
  'Aniversario',
  'Aniversario de la red de casas hogar',
  false
);

INSERT INTO public.house_event (
  house_event_id,
  event_type_id,
  house_id,
  date,
  start,
  "end",
  name,
  description
)
VALUES (
  'c2000000-0000-4000-8000-000000000002',
  'b1000000-0000-4000-8000-000000000001',
  (SELECT house_id FROM public.house WHERE name = 'Desarrollo'),
  '2026-05-03',
  '10:00:00',
  '12:00:00',
  'Visita DIF',
  'Visita por parte del DIF para ver las instalaciones'
);

INSERT INTO public.personal_event (
  personal_event_id,
  event_type_id,
  start,
  "end",
  name,
  description
)
VALUES (
  'c3000000-0000-4000-8000-000000000003',
  'b1000000-0000-4000-8000-000000000001',
  '2026-05-04 15:00:00',
  '2026-05-04 16:00:00',
  'Visita médica',
  'Se tiene que llevar a Juan Pérez al doctor'
);

INSERT INTO public.employee_personal_event (
  personal_event_id,
  employee_id
)
VALUES (
  'c3000000-0000-4000-8000-000000000003',
  (SELECT employee_id FROM public.employee WHERE email = 'andre@gmail.com')
);

INSERT INTO public.vacations_request (
  vacations_request_id,
  employee_id,
  start,
  "end",
  status,
  feedback,
  created_at,
  used_days
)
VALUES (
  'c4000000-0000-4000-8000-000000000004',
  (SELECT employee_id FROM public.employee WHERE email = 'andre@gmail.com'),
  '2026-06-10',
  '2026-06-15',
  0,
  NULL,
  NOW(),
  5
);

COMMIT;

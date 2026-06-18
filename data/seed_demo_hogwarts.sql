-- ============================================================
-- SEED DEMO HOGWARTS — RCHQ
-- Ejecutar DESPUÉS de seed_dev.sql (roles, event_type, workday, absence_type)
--
-- Casa: Hogwarts
-- Contraseña de todos: Andatti67
--
-- Logins:
--   a.dumbledore@rchq.com  (Coordinador)
--   h.potter@rchq.com
--   r.weasley@rchq.com     (ausencia 11–12 jun)
--   h.grainger@rchq.com
--   n.longbottom@rchq.com  (empleado nuevo, perfil completo)
--
-- Re-run safe: ON CONFLICT / DO UPDATE donde aplica
-- ============================================================

-- =========================
-- CASA
-- =========================
INSERT INTO public.house (house_id, name, location, phone_number, description, image)
VALUES (
  'a0000001-0000-4000-8000-000000000099',
  'Hogwarts',
  'Escocia, Reino Unido',
  '4420000999',
  'Casa demo temática Harry Potter para presentación de funcionalidades clave',
  'default_house'
)
ON CONFLICT (house_id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  phone_number = EXCLUDED.phone_number,
  description = EXCLUDED.description,
  image = EXCLUDED.image;

-- =========================
-- EMPLEADOS
-- Contraseña: Andatti67
-- =========================
INSERT INTO public.employee (
  employee_id, house_id, role_id, name, surname,
  is_active, email, password, has_first_login,
  is_active_two_factor_auth, failed_login_attempts, failed_two_factor_auth_attempts,
  totp_secret, curp, rfc, birth_date, picture, start_date,
  phone_number, nss, bank_account, type
)
VALUES
(
  'e4000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000099',
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Albus',
  'Dumbledore',
  true,
  'a.dumbledore@rchq.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'DUAL880701HDFBMB01',
  'DUMB880701ABC',
  '1881-07-01',
  NULL,
  '2024-09-01',
  '4421000001',
  NULL,
  NULL,
  'nomina'
),
(
  'e4000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000099',
  (SELECT role_id FROM public.role WHERE name = 'Responsable del cuidado de NNA' LIMIT 1),
  'Harry',
  'Potter',
  true,
  'h.potter@rchq.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'POTH980731HDFRTL02',
  'POTH980731ABC',
  '1980-07-31',
  NULL,
  '2025-01-15',
  '4421000002',
  '12345678901',
  '012345678901234567',
  'nomina'
),
(
  'e4000001-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000099',
  (SELECT role_id FROM public.role WHERE name = 'Responsable del cuidado de NNA' LIMIT 1),
  'Ron',
  'Weasley',
  true,
  'r.weasley@rchq.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'WEAR800301HDFRSL03',
  'WEAR800301ABC',
  '1980-03-01',
  NULL,
  '2025-02-01',
  '4421000003',
  '23456789012',
  '123456789012345678',
  'nomina'
),
(
  'e4000001-0000-4000-8000-000000000004',
  'a0000001-0000-4000-8000-000000000099',
  (SELECT role_id FROM public.role WHERE name = 'Psicóloga' LIMIT 1),
  'Hermione',
  'Grainger',
  true,
  'h.grainger@rchq.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'GRAH790919MDFRMR04',
  'GRAH790919ABC',
  '1979-09-19',
  NULL,
  '2025-02-15',
  '4421000004',
  '34567890123',
  '234567890123456789',
  'nomina'
),
(
  'e4000001-0000-4000-8000-000000000005',
  'a0000001-0000-4000-8000-000000000099',
  (SELECT role_id FROM public.role WHERE name = 'Trabajador Social' LIMIT 1),
  'Neville',
  'Longbottom',
  true,
  'n.longbottom@rchq.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  true,
  false,
  0,
  0,
  NULL,
  'LONN800730HDFNGV05',
  'LONN800730ABC',
  '1980-07-30',
  NULL,
  '2026-06-01',
  '4421000005',
  '45678901234',
  '345678901234567890',
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  name = EXCLUDED.name,
  surname = EXCLUDED.surname,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  curp = EXCLUDED.curp,
  rfc = EXCLUDED.rfc,
  birth_date = EXCLUDED.birth_date,
  start_date = EXCLUDED.start_date,
  phone_number = EXCLUDED.phone_number,
  nss = EXCLUDED.nss,
  bank_account = EXCLUDED.bank_account,
  type = EXCLUDED.type;

-- =========================
-- NEVILLE — perfil completo (dirección + jornada)
-- =========================
INSERT INTO public.employee_address (
  employee_address_id, employee_id, url, street, municipio, city, postal_code, date
)
VALUES (
  'f4000001-0000-4000-8000-000000000001',
  'e4000001-0000-4000-8000-000000000005',
  'https://maps.google.com/?q=56.8700,-5.4500',
  'Torre de Gryffindor, Ala Este',
  'Hogsmeade',
  'Escocia',
  '00001',
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

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT w.workday_id, e.employee_id, '09:00:00'::time, '18:00:00'::time
FROM public.employee e
CROSS JOIN public.workday w
WHERE e.email IN (
  'a.dumbledore@rchq.com',
  'h.potter@rchq.com',
  'r.weasley@rchq.com',
  'h.grainger@rchq.com',
  'n.longbottom@rchq.com'
)
AND w.name IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes')
ON CONFLICT (workday_id, employee_id) DO UPDATE SET
  start = EXCLUDED.start,
  "end" = EXCLUDED."end";

-- =========================
-- EVENTOS
-- =========================

-- Capacitación PASADA → reconocimiento en perfil (Harry, Ron, Hermione)
INSERT INTO public.personal_event (
  personal_event_id, event_type_id, date, start, "end",
  name, description, all_day, trainer
)
VALUES (
  'c4000000-0000-4000-8000-000000000001',
  (SELECT event_type_id FROM public.event_type WHERE name = 'Capacitaciones' LIMIT 1),
  '2026-05-28',
  '2026-05-28 10:00:00',
  '2026-05-28 12:00:00',
  'Defensa contra las Artes Oscuras',
  'Capacitación interna completada — genera reconocimiento en perfil del empleado',
  false,
  'Profesor Lupin'
)
ON CONFLICT (personal_event_id) DO UPDATE SET
  event_type_id = EXCLUDED.event_type_id,
  date = EXCLUDED.date,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  all_day = EXCLUDED.all_day,
  trainer = EXCLUDED.trainer;

-- Capacitación 9 de junio (Harry, Ron, Hermione)
INSERT INTO public.personal_event (
  personal_event_id, event_type_id, date, start, "end",
  name, description, all_day, trainer
)
VALUES (
  'c4000000-0000-4000-8000-000000000002',
  (SELECT event_type_id FROM public.event_type WHERE name = 'Capacitaciones' LIMIT 1),
  '2026-06-09',
  '2026-06-09 10:00:00',
  '2026-06-09 12:00:00',
  'Pociones avanzadas',
  'Capacitación asignada a Harry, Ron y Hermione',
  false,
  'Profesor Snape'
)
ON CONFLICT (personal_event_id) DO UPDATE SET
  event_type_id = EXCLUDED.event_type_id,
  date = EXCLUDED.date,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  all_day = EXCLUDED.all_day,
  trainer = EXCLUDED.trainer;

-- Evento personal Dumbledore — 10 de junio
INSERT INTO public.personal_event (
  personal_event_id, event_type_id, date, start, "end",
  name, description, all_day
)
VALUES (
  'c4000000-0000-4000-8000-000000000003',
  (SELECT event_type_id FROM public.event_type WHERE name = 'Tarea' LIMIT 1),
  '2026-06-10',
  '2026-06-10 08:00:00',
  '2026-06-10 12:00:00',
  'Atender los unicornios',
  'Recorrido y cuidado de unicornios en el Bosque Prohibido',
  false
)
ON CONFLICT (personal_event_id) DO UPDATE SET
  event_type_id = EXCLUDED.event_type_id,
  date = EXCLUDED.date,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  all_day = EXCLUDED.all_day;

-- Evento personal Harry
INSERT INTO public.personal_event (
  personal_event_id, event_type_id, date, start, "end",
  name, description, all_day
)
VALUES (
  'c4000000-0000-4000-8000-000000000004',
  (SELECT event_type_id FROM public.event_type WHERE name = 'General' LIMIT 1),
  '2026-06-08',
  '2026-06-08 16:00:00',
  '2026-06-08 18:00:00',
  'Práctica de vuelo con escoba',
  'Sesión personal de entrenamiento en el campo de Quidditch',
  false
)
ON CONFLICT (personal_event_id) DO UPDATE SET
  event_type_id = EXCLUDED.event_type_id,
  date = EXCLUDED.date,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  all_day = EXCLUDED.all_day;

-- Asignaciones de eventos personales
INSERT INTO public.employee_personal_event (personal_event_id, employee_id)
SELECT pe.personal_event_id, e.employee_id
FROM (VALUES
  ('c4000000-0000-4000-8000-000000000001'::uuid, 'h.potter@rchq.com'),
  ('c4000000-0000-4000-8000-000000000001'::uuid, 'r.weasley@rchq.com'),
  ('c4000000-0000-4000-8000-000000000001'::uuid, 'h.grainger@rchq.com'),
  ('c4000000-0000-4000-8000-000000000002'::uuid, 'h.potter@rchq.com'),
  ('c4000000-0000-4000-8000-000000000002'::uuid, 'r.weasley@rchq.com'),
  ('c4000000-0000-4000-8000-000000000002'::uuid, 'h.grainger@rchq.com'),
  ('c4000000-0000-4000-8000-000000000003'::uuid, 'a.dumbledore@rchq.com'),
  ('c4000000-0000-4000-8000-000000000004'::uuid, 'h.potter@rchq.com')
) AS pe(personal_event_id, email)
JOIN public.employee e ON e.email = pe.email
ON CONFLICT (personal_event_id, employee_id) DO NOTHING;

-- Evento de casa — 11 de junio
INSERT INTO public.house_event (
  house_event_id, event_type_id, house_id, start, "end",
  name, description, all_day, is_free_day
)
VALUES (
  'c4000000-0000-4000-8000-000000000011',
  (SELECT event_type_id FROM public.event_type WHERE name = 'General' LIMIT 1),
  'a0000001-0000-4000-8000-000000000099',
  '2026-06-11 19:00:00',
  '2026-06-11 22:00:00',
  'Cena Formal Gryffindor',
  'Cena de gala en el Gran Comedor para la casa Gryffindor',
  false,
  false
)
ON CONFLICT (house_event_id) DO UPDATE SET
  event_type_id = EXCLUDED.event_type_id,
  house_id = EXCLUDED.house_id,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  all_day = EXCLUDED.all_day,
  is_free_day = EXCLUDED.is_free_day;

-- Evento global — 12 de junio
INSERT INTO public.global_event (
  global_event_id, event_type_id, start, "end",
  name, description, all_day, is_free_day
)
VALUES (
  'c4000000-0000-4000-8000-000000000012',
  (SELECT event_type_id FROM public.event_type WHERE name = 'General' LIMIT 1),
  '2026-06-12 15:00:00',
  '2026-06-12 18:00:00',
  'Quidditch Gryffindor contra Slytherin',
  'Partido de Quidditch intercasas en el estadio de Hogwarts',
  false,
  false
)
ON CONFLICT (global_event_id) DO UPDATE SET
  event_type_id = EXCLUDED.event_type_id,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  all_day = EXCLUDED.all_day,
  is_free_day = EXCLUDED.is_free_day;

-- =========================
-- AUSENCIA Ron — 11 al 12 de junio
-- =========================
INSERT INTO public.absence (
  absence_id, employee_id, absence_type_id, start, "end", description, url, is_deleted
)
SELECT
  'a4000001-0000-4000-8000-000000000001',
  e.employee_id,
  (SELECT absence_type_id FROM public.absence_type WHERE name = 'Médica' LIMIT 1),
  '2026-06-11',
  '2026-06-12',
  'Ausencia por recuperación de hechizo fallido en clase de Transformaciones',
  '',
  false
FROM public.employee e
WHERE e.email = 'r.weasley@rchq.com'
ON CONFLICT (absence_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  absence_type_id = EXCLUDED.absence_type_id,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  description = EXCLUDED.description,
  is_deleted = EXCLUDED.is_deleted;

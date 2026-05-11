-- ============================================================
-- SEED MINIMAL — RCHQ
-- Login: andre@gmail.com / Andatti67
-- Re-run safe: todos los inserts tienen ON CONFLICT DO NOTHING
-- ============================================================

-- =========================
-- HOUSES
-- =========================
INSERT INTO public.house (house_id, name, location, phone_number, description, image)
VALUES 
('a0000001-0000-4000-8000-000000000001', 'Desarrollo', 'Tec de Monterrey', '4424792232', 'Casa de desarrollo', 'boop'),
('a0000001-0000-4000-8000-000000000002', 'Sonríe villa infantil', 'Querétaro, Qro.', '4420000001', 'Institución de asistencia infantil', 'default_house'),
('a0000001-0000-4000-8000-000000000003', 'Ammi casa infantil', 'Querétaro, Qro.', '4420000002', 'Hogar para niños y niñas', 'default_house'),
('a0000001-0000-4000-8000-000000000004', 'Casa Hogar Esperanza Para ti', 'Querétaro, Qro.', '4420000003', 'Apoyo integral a la infancia', 'default_house'),
('a0000001-0000-4000-8000-000000000005', 'Hogar juvenil del santisimo rendentor I.A.P', 'Querétaro, Qro.', '4420000004', 'Hogar juvenil', 'default_house'),
('a0000001-0000-4000-8000-000000000006', 'La Alegría de los niños', 'Querétaro, Qro.', '4420000005', 'I.A.P. dedicada al cuidado infantil', 'default_house'),
('a0000001-0000-4000-8000-000000000007', 'Casa de Jesús', 'Querétaro, Qro.', '4420000006', 'Asistencia social infantil', 'default_house'),
('a0000001-0000-4000-8000-000000000008', 'Ministerios Pan de Vida', 'Querétaro, Qro.', '4420000007', 'Apoyo y refugio infantil', 'default_house'),
('a0000001-0000-4000-8000-000000000009', 'Hogares Providencia de Querétaro', 'Querétaro, Qro.', '4420000008', 'Protección a niños en situación de calle', 'default_house'),
('a0000001-0000-4000-8000-000000000010', 'Proyecto de Vida I.A.P', 'Querétaro, Qro.', '4420000009', 'Desarrollo humano y social', 'default_house'),
('a0000001-0000-4000-8000-000000000011', 'Puerta Abierta I.A.P', 'Querétaro, Qro.', '4420000010', 'Atención a niñas y adolescentes', 'default_house'),
('a0000001-0000-4000-8000-000000000012', 'Senderos I.A.P', 'Querétaro, Qro.', '4420000011', 'Camino a una vida digna', 'default_house'),
('a0000001-0000-4000-8000-000000000013', 'Casa María Goretti I.A.P', 'Querétaro, Qro.', '4420000012', 'Atención especializada', 'default_house')
ON CONFLICT DO NOTHING;

-- =========================
-- ROLES
-- =========================
INSERT INTO public.role (role_id, name)
VALUES 
('a0000002-0000-4000-8000-000000000001', 'Coordinador'),
('a0000002-0000-4000-8000-000000000002', 'Admin'),
('a0000002-0000-4000-8000-000000000003', 'Mantenimiento'),
('a0000002-0000-4000-8000-000000000004', 'Lavandería'),
('a0000002-0000-4000-8000-000000000005', 'Responsable del cuidado de NNA'),
('a0000002-0000-4000-8000-000000000006', 'Psicóloga'),
('a0000002-0000-4000-8000-000000000007', 'Psicólogo'),
('a0000002-0000-4000-8000-000000000008', 'Trabajador Social'),
('a0000002-0000-4000-8000-000000000009', 'Coordinador Operativo'),
('a0000002-0000-4000-8000-000000000010', 'Coordinador Administrativo'),
('a0000002-0000-4000-8000-000000000011', 'Coordinador de Programa'),
('a0000002-0000-4000-8000-000000000012', 'Dirección Operativa'),
('a0000002-0000-4000-8000-000000000013', 'Dirección Administrativa'),
('a0000002-0000-4000-8000-000000000014', 'Dirección de Programa'),
('a0000002-0000-4000-8000-000000000015', 'Procuración de Fondos'),
('a0000002-0000-4000-8000-000000000016', 'Enfermera'),
('a0000002-0000-4000-8000-000000000017', 'Terapeuta'),
('a0000002-0000-4000-8000-000000000018', 'Asistente de Dirección'),
('a0000002-0000-4000-8000-000000000019', 'Asistente de Finanzas'),
('a0000002-0000-4000-8000-000000000020', 'Auxiliar de Limpieza'),
('a0000002-0000-4000-8000-000000000021', 'Auxiliar de Lavandería'),
('a0000002-0000-4000-8000-000000000022', 'Chofer'),
('a0000002-0000-4000-8000-000000000023', 'Cocinera')
ON CONFLICT DO NOTHING;

-- =========================
-- PRIVILEGES
-- =========================
INSERT INTO public.privileges (privilege_id, name)
VALUES
('00000001-0000-4000-8000-000000000001', 'viewEmployees'),
('00000001-0000-4000-8000-000000000002', 'createEmployees'),
('00000001-0000-4000-8000-000000000003', 'manageEmployees'),
('00000001-0000-4000-8000-000000000004', 'viewDocuments'),
('00000001-0000-4000-8000-000000000005', 'manageDocuments'),
('00000001-0000-4000-8000-000000000006', 'viewLogs'),
('00000001-0000-4000-8000-000000000007', 'viewEmployeesAbsences'),
('00000001-0000-4000-8000-000000000008', 'manageEmployeesAbsences')
ON CONFLICT DO NOTHING;

-- =========================
-- ROLE_PRIVILEGE
-- =========================

-- Admin — todos los privilegios
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT 'a0000002-0000-4000-8000-000000000002', privilege_id
FROM public.privileges
ON CONFLICT DO NOTHING;

-- Coordinador — gestión completa excepto logs
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT 'a0000002-0000-4000-8000-000000000001', p.privilege_id
FROM public.privileges p
WHERE p.name IN ('viewEmployees', 'createEmployees', 'manageEmployees', 'viewDocuments', 'manageDocuments', 'viewEmployeesAbsences', 'manageEmployeesAbsences')
ON CONFLICT DO NOTHING;

-- Roles que solo ven documentos
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE r.name IN (
  'Psicóloga', 'Psicólogo', 'Trabajador Social', 'Enfermera',
  'Terapeuta', 'Responsable del cuidado de NNA',
  'Asistente de Dirección', 'Asistente de Finanzas'
)
AND p.name = 'viewDocuments'
ON CONFLICT DO NOTHING;

-- Coordinadores de área — ver empleados y documentos
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE r.name IN ('Coordinador Operativo', 'Coordinador Administrativo', 'Coordinador de Programa')
AND p.name IN ('viewEmployees', 'viewDocuments')
ON CONFLICT DO NOTHING;

-- Direcciones — ver empleados, documentos y logs
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE r.name IN ('Dirección Operativa', 'Dirección Administrativa', 'Dirección de Programa')
AND p.name IN ('viewEmployees', 'viewDocuments', 'viewLogs', 'createEmployees', 'manageEmployees', 'viewEmployeesAbsences', 'manageEmployeesAbsences')
ON CONFLICT DO NOTHING;

-- =========================
-- EMPLOYEE
-- Contraseña: Andatti67
-- =========================
INSERT INTO public.employee (
    employee_id, house_id, role_id, name, surname,
    is_active, email, password, has_first_login,
    failed_login_attempts, totp_secret, curp, rfc,
    birth_date, picture, start_date, nss, bank_account,
    blocked_until, temp_totp_secret, temp_totp_secret_created_at,
    type
)
VALUES (
  'b8f54b14-701e-4e87-a019-caef53dcda99',
  (SELECT house_id FROM public.house  WHERE name = 'Desarrollo' LIMIT 1),
  (SELECT role_id  FROM public.role   WHERE name = 'Admin'      LIMIT 1),
  'Carlos',
  'Ramírez',
  true,
  'andre@gmail.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
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
  NULL,
  'nomina'
)
ON CONFLICT DO NOTHING;
-- =========================
-- ACTIONS
-- =========================
INSERT INTO public.action (action_id, description, important) VALUES
('auth-001', 'Intento fallido de autenticación', false),
('auth-002', 'Cuenta bloqueada temporalmente por múltiples intentos fallidos', false),
('auth-003', 'Inicio de sesión exitoso', false),
('auth-004', 'Primer acceso validado, pendiente cambio de contraseña', false),
('auth-005', 'Cambio de contraseña en primer acceso', false),
('auth-006', 'Inicio de sesión completado después de cambio de contraseña en primer acceso', false),
('auth-007', 'Activación exitosa de TwoFactorAuth', false),
('auth-008', 'Activación fallida de TwoFactorAuth', false),
('auth-009', 'Fallo de autenticación TwoFactorAuth', false),
('auth-010', 'Inicio de sesión exitoso con TwoFactorAuth', false),
('auth-011', 'Desactivación exitosa de TwoFactorAuth', false),
('auth-012', 'Intento de acceso denegado: usuario inactivo', false),
('auth-013', 'Intento de cambio de contraseña en primer acceso para usuario inactivo', false),
('auth-014', 'Intento de configuración de TwoFactorAuth para usuario inactivo', false),
('auth-015', 'Intento de verificación TwoFactorAuth para usuario inactivo', false),
('auth-016', 'Intento de validación de TwoFactorAuth para usuario inactivo', false),
('auth-017', 'Intento de desactivación de TwoFactorAuth para usuario inactivo', false),
('auth-018', 'Fallo de desactivación de TwoFactorAuth por contraseña incorrecta', false),
('auth-019', 'TwoFactorAuth bloqueado temporalmente por múltiples intentos fallidos', false),
('auth-020', 'Cambio de contraseña exitoso', false),
('auth-021', 'Intento de cambio de contraseña para usuario inactivo', false),
('auth-022', 'Fallo de cambio de contraseña por contraseña actual incorrecta', false),
('vaca-001', 'Creación de solicitud de vacaciones exitosa', false),
('vaca-002', 'Registro de vacaciones de empleado exitoso', false),
('empl-001', 'Empleado creado con éxito', false),
('empl-002', 'Documento de empleado subido', false),
('empl-003', 'Documento de empleado actualizado', false),
('empl-004', 'Documento de empleado eliminado', false),
('empl-005', 'Información de empleado actualizada', false)
ON CONFLICT DO NOTHING;

INSERT INTO public.workday (workday_id, name)
VALUES
('c0000001-0000-4000-8000-000000000001', 'Lunes'),
('c0000001-0000-4000-8000-000000000002', 'Martes'),
('c0000001-0000-4000-8000-000000000003', 'Miércoles'),
('c0000001-0000-4000-8000-000000000004', 'Jueves'),
('c0000001-0000-4000-8000-000000000005', 'Viernes'),
('c0000001-0000-4000-8000-000000000006', 'Sábado'),
('c0000001-0000-4000-8000-000000000007', 'Domingo');

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end") VALUES
('c0000001-0000-4000-8000-000000000001', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00'),
('c0000001-0000-4000-8000-000000000002', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00'),
('c0000001-0000-4000-8000-000000000003', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00'),
('c0000001-0000-4000-8000-000000000004', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00'),
('c0000001-0000-4000-8000-000000000005', (SELECT employee_id FROM public.employee LIMIT 1), '09:00:00', '18:00:00');

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
  4
);

-- =========================
-- DOCUMENTOS
-- =========================

INSERT INTO public.documents (document_id, name)
VALUES
('c0000001-0000-4000-8000-000000000001', 'Curriculum Vitae'),
('c0000001-0000-4000-8000-000000000002', 'Acta de Nacimiento'),
('c0000001-0000-4000-8000-000000000003', 'CURP'),
('c0000001-0000-4000-8000-000000000004', 'INE'),
('c0000001-0000-4000-8000-000000000005', 'Constancia de Situación Fiscal'),
('c0000001-0000-4000-8000-000000000006', 'Comprobante de Domicilio'),
('c0000001-0000-4000-8000-000000000007', 'Número IMSS / NSS'),
('c0000001-0000-4000-8000-000000000008', 'Cédula Profesional'),
('c0000001-0000-4000-8000-000000000009', 'Título o Comprobante de Último Nivel de Estudios'),
('c0000001-0000-4000-8000-000000000010', 'Certificado Médico'),
('c0000001-0000-4000-8000-000000000011', 'Carta de No Antecedentes Penales Estatal'),
('c0000001-0000-4000-8000-000000000012', 'Carta de No Antecedentes Penales Federal'),
('c0000001-0000-4000-8000-000000000013', 'Cuenta Bancaria'),
('c0000001-0000-4000-8000-000000000014', 'Carta de Recomendación 1'),
('c0000001-0000-4000-8000-000000000015', 'Carta de Recomendación 2'),
('c0000001-0000-4000-8000-000000000016', 'Licencia de Manejo'),
('c0000001-0000-4000-8000-000000000017', 'Perfil del Puesto / Manual de Puesto'),
('c0000001-0000-4000-8000-000000000018', 'Contrato'),
('c0000001-0000-4000-8000-000000000019', 'Reglamento Interno de Trabajo Firmado'),
('c0000001-0000-4000-8000-000000000020', 'Carta de Confidencialidad Firmada'),
('c0000001-0000-4000-8000-000000000021', 'Código de Ética Firmado'),
('c0000001-0000-4000-8000-000000000022', 'Manual de Inducción'),
('c0000001-0000-4000-8000-000000000023', 'Comprobante de Domicilio Actualización Semestral'),
('c0000001-0000-4000-8000-000000000024', 'Constancia de Capacitación o Certificación')
ON CONFLICT DO NOTHING;

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
  is_active_two_factor_auth,
  failed_login_attempts,
  failed_two_factor_auth_attempts,
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
  (SELECT role_id FROM public.role WHERE name = 'Admin' LIMIT 1),
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

UPDATE public.employee
SET
  house_id = COALESCE(
    (SELECT house_id FROM public.house WHERE house_id = 'a0000001-0000-4000-8000-000000000001'),
    house_id
  ),
  phone_number = COALESCE(phone_number, '+52 442 479 2232')
WHERE email = 'andre@gmail.com';

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

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT 'c0000001-0000-4000-8000-000000000001', e.employee_id, '08:00:00', '17:00:00'
FROM public.employee e WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT 'c0000001-0000-4000-8000-000000000002', e.employee_id, '09:00:00', '18:00:00'
FROM public.employee e WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT 'c0000001-0000-4000-8000-000000000004', e.employee_id, '07:00:00', '16:00:00'
FROM public.employee e WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT 'c0000001-0000-4000-8000-000000000005', e.employee_id, '10:00:00', '19:00:00'
FROM public.employee e WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

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
  'c4000000-0000-4000-8000-000000000005',
  (SELECT employee_id FROM public.employee WHERE email = 'maria.operaciones@example.com'),
  '2026-06-10',
  '2026-06-15',
  0,
  NULL,
  NOW(),
  4
);
INSERT INTO public.absence_type (absence_type_id, name)
VALUES
('a0000001-0000-4000-8000-000000000001', 'Médica'),
('a0000001-0000-4000-8000-000000000002', 'Paternidad'),
('a0000001-0000-4000-8000-000000000003', 'Maternidad')
ON CONFLICT DO NOTHING;

INSERT INTO PUBLIC.frecuency_of_payment (
  frecuency_of_payment_id,
  name
) VALUES
  ('f0000001-0000-4000-8000-000000000001', 'semanal'),
  ('f0000002-0000-4000-8000-000000000002', 'quincenal'),
  ('f0000003-0000-4000-8000-000000000003', 'mensual')
ON CONFLICT DO NOTHING;

-- =========================
-- ABSENCES — con evidencia
-- =========================
INSERT INTO public.absence (
  absence_id,
  employee_id,
  absence_type_id,
  start,
  "end",
  description,
  url,
  is_deleted
)
VALUES
  -- Carlos (andre@gmail.com) — Médica con PDF
  (
    'ab000001-0000-4000-8000-000000000001',
    'b8f54b14-701e-4e87-a019-caef53dcda99',
    (SELECT absence_type_id FROM public.absence_type WHERE name = 'Médica'),
    '2026-05-03',
    '2026-05-07',
    'Reposo por cirugía menor',
    'uploads/evidencia_medica_carlos.pdf',
    false
  ),
  -- Carlos — Paternidad con PDF
  (
    'ab000002-0000-4000-8000-000000000002',
    'b8f54b14-701e-4e87-a019-caef53dcda99',
    (SELECT absence_type_id FROM public.absence_type WHERE name = 'Paternidad'),
    '2026-04-14',
    '2026-04-18',
    'Nacimiento de hijo',
    'uploads/evidencia_paternidad_carlos.pdf',
    false
  ),
  -- María (maria.operaciones@example.com) — Maternidad con PDF
  (
    'ab000003-0000-4000-8000-000000000003',
    'e0000001-0000-4000-8000-000000000001',
    (SELECT absence_type_id FROM public.absence_type WHERE name = 'Maternidad'),
    '2026-03-01',
    '2026-05-23',
    'Licencia de maternidad',
    'uploads/evidencia_maternidad_maria.pdf',
    false
  ),

-- =========================
-- ABSENCES — sin evidencia
-- =========================
  -- Carlos — Maternidad sin PDF
  (
    'ab000004-0000-4000-8000-000000000004',
    'b8f54b14-701e-4e87-a019-caef53dcda99',
    (SELECT absence_type_id FROM public.absence_type WHERE name = 'Maternidad'),
    '2026-03-10',
    '2026-03-14',
    'Permiso sin comprobante entregado',
    NULL,
    false
  ),
  -- Carlos — Médica sin PDF
  (
    'ab000005-0000-4000-8000-000000000005',
    'b8f54b14-701e-4e87-a019-caef53dcda99',
    (SELECT absence_type_id FROM public.absence_type WHERE name = 'Médica'),
    '2026-02-20',
    '2026-02-21',
    'Cita médica de urgencia',
    NULL,
    false
  ),
  -- María — Médica sin PDF
  (
    'ab000006-0000-4000-8000-000000000006',
    'e0000001-0000-4000-8000-000000000001',
    (SELECT absence_type_id FROM public.absence_type WHERE name = 'Médica'),
    '2026-01-15',
    '2026-01-16',
    'Consulta médica general',
    NULL,
    false
  )

ON CONFLICT DO NOTHING;


COMMIT;
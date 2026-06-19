-- ============================================================
-- SEED Production — RCHQ
-- Re-run safe: todos los inserts tienen ON CONFLICT DO NOTHING
-- produccion
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- HOUSES
-- =========================
INSERT INTO public.house (house_id, name, location, phone_number, description, image)
VALUES 
(gen_random_uuid(), 'Casa María Goretti I.A.P', 'Querétaro, Qro.', '4420000012', 'Atención especializada', 'default_house'),
(gen_random_uuid(), 'Sonríe villa infantil', 'Querétaro, Qro.', '4420000001', 'Institución de asistencia infantil', 'default_house'),
(gen_random_uuid(), 'Ammi casa infantil', 'Querétaro, Qro.', '4420000002', 'Hogar para niños y niñas', 'default_house'),
(gen_random_uuid(), 'Casa Hogar Esperanza Para ti', 'Querétaro, Qro.', '4420000003', 'Apoyo integral a la infancia', 'default_house'),
(gen_random_uuid(), 'Hogar juvenil del santisimo rendentor I.A.P', 'Querétaro, Qro.', '4420000004', 'Hogar juvenil', 'default_house'),
(gen_random_uuid(), 'La Alegría de los niños', 'Querétaro, Qro.', '4420000005', 'I.A.P. dedicada al cuidado infantil', 'default_house'),
(gen_random_uuid(), 'Casa de Jesús', 'Querétaro, Qro.', '4420000006', 'Asistencia social infantil', 'default_house'),
(gen_random_uuid(), 'Ministerios Pan de Vida', 'Querétaro, Qro.', '4420000007', 'Apoyo y refugio infantil', 'default_house'),
(gen_random_uuid(), 'Hogares Providencia de Querétaro', 'Querétaro, Qro.', '4420000008', 'Protección a niños en situación de calle', 'default_house'),
(gen_random_uuid(), 'Proyecto de Vida I.A.P', 'Querétaro, Qro.', '4420000009', 'Desarrollo humano y social', 'default_house'),
(gen_random_uuid(), 'Puerta Abierta I.A.P', 'Querétaro, Qro.', '4420000010', 'Atención a niñas y adolescentes', 'default_house'),
(gen_random_uuid(), 'Senderos I.A.P', 'Querétaro, Qro.', '4420000011', 'Camino a una vida digna', 'default_house')
ON CONFLICT DO NOTHING;

-- =========================
-- ROLES
-- =========================
INSERT INTO public.role (role_id, name)
VALUES 
(gen_random_uuid(), 'Coordinador'),
(gen_random_uuid(), 'Administrador'),
(gen_random_uuid(), 'Mantenimiento'),
(gen_random_uuid(), 'Lavandería'),
(gen_random_uuid(), 'Cuidador'),
(gen_random_uuid(), 'Psicóloga'),
(gen_random_uuid(), 'Psicólogo'),
(gen_random_uuid(), 'Trabajador Social'),
(gen_random_uuid(), 'Coordinador Operativo'),
(gen_random_uuid(), 'Coordinador Administrativo'),
(gen_random_uuid(), 'Coordinador de Programa'),
(gen_random_uuid(), 'Dirección Operativa'),
(gen_random_uuid(), 'Dirección Administrativa'),
(gen_random_uuid(), 'Dirección de Programa'),
(gen_random_uuid(), 'Procuración de Fondos'),
(gen_random_uuid(), 'Enfermera'),
(gen_random_uuid(), 'Terapeuta'),
(gen_random_uuid(), 'Asistente de Dirección'),
(gen_random_uuid(), 'Asistente de Finanzas'),
(gen_random_uuid(), 'Auxiliar de Limpieza'),
(gen_random_uuid(), 'Auxiliar de Lavandería'),
(gen_random_uuid(), 'Chofer'),
(gen_random_uuid(), 'Cocinera'),
(gen_random_uuid(), 'Asistente Operativo'),
(gen_random_uuid(), 'Asistente Administrativo'),
(gen_random_uuid(), 'Intendencia')
ON CONFLICT DO NOTHING;

-- =========================
-- PRIVILEGES
-- =========================
INSERT INTO public.privileges (privilege_id, name)
VALUES
(gen_random_uuid(), 'viewEmployees'),
(gen_random_uuid(), 'createEmployees'),
(gen_random_uuid(), 'manageEmployees'),
(gen_random_uuid(), 'viewDocuments'),
(gen_random_uuid(), 'manageDocuments'),
(gen_random_uuid(), 'viewLogs'),
(gen_random_uuid(), 'viewEvents'),
(gen_random_uuid(), 'addToBlacklist'),
(gen_random_uuid(), 'createEvent'),
(gen_random_uuid(), 'editAbsences'),
(gen_random_uuid(), 'deleteAbsences'),
(gen_random_uuid(), 'addAbsences'),
(gen_random_uuid(), 'deleteEvent'),
(gen_random_uuid(), 'editEvent'),
(gen_random_uuid(), 'viewBlacklist'),
(gen_random_uuid(), 'removeFromBlacklist'),
(gen_random_uuid(), 'viewSelfVacations'),
(gen_random_uuid(), 'editVacations')
ON CONFLICT DO NOTHING;

-- =========================
-- ROLE_PRIVILEGE
-- =========================

-- Administrador — todos los privilegios
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
JOIN public.privileges p ON TRUE
WHERE r.name = 'Administrador'
ON CONFLICT DO NOTHING;

-- Coordinador — gestión completa incluyendo logs
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
JOIN public.privileges p ON TRUE
WHERE r.name = 'Coordinador'
AND p.name IN ('viewEmployees', 'createEmployees', 'manageEmployees', 'viewDocuments', 'manageDocuments', 'viewLogs', 'addToBlacklist', 'viewBlacklist', 'removeFromBlacklist')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.privileges p
JOIN public.role r ON r.name = 'Coordinador'
WHERE p.name = 'editAbsences'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.privileges p
JOIN public.role r ON r.name = 'Administrador'
WHERE p.name = 'editAbsences'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.privileges p
JOIN public.role r ON r.name = 'Coordinador'
WHERE p.name = 'deleteAbsences'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.privileges p
JOIN public.role r ON r.name = 'Administrador'
WHERE p.name = 'deleteAbsences'
ON CONFLICT DO NOTHING;

-- Todos los roles pueden consultar documentos; ABAC limita el alcance
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE p.name = 'viewDocuments'
ON CONFLICT DO NOTHING;

-- Todos los roles pueden ver eventos
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE p.name = 'viewEvents'
ON CONFLICT (role_id, privilege_id) DO NOTHING;

-- Todos los roles pueden consultar sus propias vacaciones
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE p.name = 'viewSelfVacations'
ON CONFLICT (role_id, privilege_id) DO NOTHING;

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
AND p.name IN ('viewEmployees', 'viewDocuments', 'viewLogs', 'createEmployees', 'manageEmployees')
ON CONFLICT DO NOTHING;

-- Crear eventos - Casa, Global
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
JOIN public.privileges p ON p.name = 'createEvent'
WHERE r.name IN ('Administrador', 'Coordinador')
ON CONFLICT DO NOTHING;

-- Eliminar eventos de casa - Administrador y Coordinador
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
JOIN public.privileges p ON p.name = 'deleteEvent'
WHERE r.name IN ('Administrador', 'Coordinador')
ON CONFLICT DO NOTHING;

-- Editar eventos de casa - Administrador y Coordinador
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE p.name = 'editEvent'
ON CONFLICT (role_id, privilege_id) DO NOTHING;

-- Modificar vacaciones - todos los roles
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE p.name = 'editVacations'
ON CONFLICT (role_id, privilege_id) DO NOTHING;

-- Crear eventos personales - todos los roles
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE p.name = 'createEvent'
ON CONFLICT (role_id, privilege_id) DO NOTHING;

-- Crear ausencias - Administrador y Coordinador
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
JOIN public.privileges p ON p.name = 'addAbsences'
WHERE r.name IN ('Administrador', 'Coordinador')
ON CONFLICT DO NOTHING;


-- =========================
-- EMPLOYEE
-- Contraseña: Hola12345
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
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE name = 'Casa María Goretti I.A.P' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Mariana',
  'López',
  true,
  'mariana.coordinador@gmail.com',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'LOPM900101MQTPRR01',
  NULL,
  '1990-01-01',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE name = 'Casa María Goretti I.A.P' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Jorge',
  'Hernández',
  true,
  'jorge.mantenimiento@gmail.com',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'HEMJ920202HQTRRR02',
  NULL,
  '1992-02-02',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT DO NOTHING;

-- =========================
-- EMPLOYEE EXTRA ACCOUNTS
-- 10 coordinadores y 10 empleados
-- Contraseña: Hola12345
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
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000012' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Ana',
  'Torres',
  true,
  'coord01@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'TOAA900101MQTRRN01',
  NULL,
  '1990-01-01',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000012' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Luis',
  'Garcia',
  true,
  'empleado01@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'GALL900102HQTRRS01',
  NULL,
  '1990-01-02',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000001' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Brenda',
  'Morales',
  true,
  'coord02@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'MOBB900103MQTRRR02',
  NULL,
  '1990-01-03',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000001' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Pedro',
  'Sanchez',
  true,
  'empleado02@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'SAPE900104HQTRND02',
  NULL,
  '1990-01-04',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000002' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Carla',
  'Ruiz',
  true,
  'coord03@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'RUCC900105MQTRRL03',
  NULL,
  '1990-01-05',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000002' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Diego',
  'Navarro',
  true,
  'empleado03@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'NADD900106HQTRVG03',
  NULL,
  '1990-01-06',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000003' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Elena',
  'Castro',
  true,
  'coord04@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CAEE900107MQTRSL04',
  NULL,
  '1990-01-07',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000003' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Fabian',
  'Ortega',
  true,
  'empleado04@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'OEFF900108HQTRRB04',
  NULL,
  '1990-01-08',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000004' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Gabriela',
  'Perez',
  true,
  'coord05@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'PEGG900109MQTRRM05',
  NULL,
  '1990-01-09',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000004' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Hector',
  'Flores',
  true,
  'empleado05@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'FOHH900110HQTRLC05',
  NULL,
  '1990-01-10',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000005' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Irene',
  'Mendoza',
  true,
  'coord06@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'MEII900111MQTRRN06',
  NULL,
  '1990-01-11',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000005' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Julio',
  'Ramirez',
  true,
  'empleado06@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'RAJJ900112HQTRML06',
  NULL,
  '1990-01-12',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000006' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Karen',
  'Lopez',
  true,
  'coord07@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'LOKK900113MQTRRP07',
  NULL,
  '1990-01-13',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000006' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Mario',
  'Gutierrez',
  true,
  'empleado07@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'GUMM900114HQTRTR07',
  NULL,
  '1990-01-14',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000007' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Natalia',
  'Vega',
  true,
  'coord08@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'VENN900115MQTRGT08',
  NULL,
  '1990-01-15',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000007' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Oscar',
  'Jimenez',
  true,
  'empleado08@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'JIOO900116HQTRMS08',
  NULL,
  '1990-01-16',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000008' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Patricia',
  'Silva',
  true,
  'coord09@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'SIPP900117MQTRLT09',
  NULL,
  '1990-01-17',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000008' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Ricardo',
  'Cruz',
  true,
  'empleado09@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CURR900118HQTRZC09',
  NULL,
  '1990-01-18',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000009' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Sofia',
  'Herrera',
  true,
  'coord10@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'HESS900119MQTRRF10',
  NULL,
  '1990-01-19',
  NULL,
  '2025-03-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000009' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Tomas',
  'Rojas',
  true,
  'empleado10@rchq.test',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'ROTT900120HQTRMJ10',
  NULL,
  '1990-01-20',
  NULL,
  '2025-03-02',
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
('vaca-003', 'Aprobación de solicitud de vacaciones exitosa', false),
('ausn-003', 'Creación de ausencia exitosa', false),
('ausn-001', 'Actualización de ausencia exitosa', false),
('ausn-002', 'Eliminación de ausencia exitosa', false),
('vaca-004', 'Rechazo de solicitud de vacaciones exitoso', false),
('even-001', 'Evento de casa creado con éxito', false),
('even-002', 'Evento personal creado con éxito', false),
('even-003', 'Evento personal asignado a empleado', false),
('even-004', 'Evento de casa asignado a casa', false),
('even-007', 'Actualización de evento personal exitosa', false),
('even-008', 'Actualización de empleado asignado a evento personal', false),
('even-005', 'Evento de casa eliminado con éxito', true),
('even-006', 'Actualización de evento de casa exitosa', false),
('empl-001', 'Empleado creado con éxito', false),
('empl-002', 'Documento de empleado subido', false),
('empl-003', 'Documento de empleado actualizado', false),
('empl-004', 'Documento de empleado eliminado', false),
('empl-005', 'Información de empleado actualizada', false),
('vaca-005', 'Modificación de vacaciones exitosa', false),
('empl-006', 'Empleado dado de baja', true),
('empl-008', 'Fallo al dar de baja al empleado', true),
('vaca-006', 'Eliminación de vacaciones exitosa', false),
('blck-001', 'Empleado agregado a la lista negra', true),
('blck-002', 'Empleado eliminado de la lista negra', true),
('even-009', 'Evento personal eliminado con éxito', true),
('even-010', 'Empleado eliminado de capacitación', false)
ON CONFLICT DO NOTHING;

INSERT INTO public.event_type (event_type_id, name)
VALUES
('b1000000-0000-4000-8000-000000000001', 'General'),
('b1000000-0000-4000-8000-000000000002', 'Visita'),
('b1000000-0000-4000-8000-000000000003', 'Tarea'),
('b1000000-0000-4000-8000-000000000004', 'Capacitaciones')
ON CONFLICT (name) DO NOTHING;

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
('c0000001-0000-4000-8000-000000000024', 'Constancia de Capacitación o Certificación'),
('c0000001-0000-4000-8000-000000000025', 'Acta Administrativa 1'),
('c0000001-0000-4000-8000-000000000026', 'Acta Administrativa 2'),
('c0000001-0000-4000-8000-000000000027', 'Acta Administrativa 3'),
('c0000001-0000-4000-8000-000000000028', 'Contacto de Emergencia 1'),
('c0000001-0000-4000-8000-000000000029', 'Contacto de Emergencia 2'),
('c0000001-0000-4000-8000-000000000030', 'Hoja de Retención de INFONAVIT'),
('c0000001-0000-4000-8000-000000000031', 'Carta Solicitud de la Escuela / Universidad (Servicio Social)'),
('c0000001-0000-4000-8000-000000000032', 'Carta de Voluntariado'),
('c0000001-0000-4000-8000-000000000033', 'Norma del Voluntario (Ley General de Voluntariado)'),
('c0000001-0000-4000-8000-000000000034', 'Plan de Voluntariado'),
('c0000001-0000-4000-8000-000000000035', 'Aviso de Privacidad'),
('c0000001-0000-4000-8000-000000000036', 'Identificación de la Universidad'),
('c0000001-0000-4000-8000-000000000037', 'Reportes Voluntarios / Servicio Social'),
('c0000001-0000-4000-8000-000000000038', 'Carta de Acreditación de Horas'),
('c0000001-0000-4000-8000-000000000039', 'Evaluación de Desempeño'),
('c0000001-0000-4000-8000-000000000040', 'Pruebas Psicométricas o Psicológicas'),
('c0000001-0000-4000-8000-000000000041', 'Carta de Renuncia'),
('c0000001-0000-4000-8000-000000000042', 'Finiquito Firmado'),
('c0000001-0000-4000-8000-000000000043', 'Carta de Despido'),
('c0000001-0000-4000-8000-000000000044', 'Carta de Recepción de Equipo de Trabajo o Uniforme'),
('c0000001-0000-4000-8000-000000000045', 'Permiso de Trabajo (para extranjeros)')
ON CONFLICT DO NOTHING;


INSERT INTO public.absence_type (absence_type_id, name)
VALUES
('a0000001-0000-4000-8000-000000000001', 'Médica'),
('a0000001-0000-4000-8000-000000000002', 'Paternidad'),
('a0000001-0000-4000-8000-000000000003', 'Maternidad'),
('a0000001-0000-4000-8000-000000000004', 'Otro')
ON CONFLICT DO NOTHING;


INSERT INTO PUBLIC.frecuency_of_payment (
  frecuency_of_payment_id,
  name
) VALUES
  ('f0000001-0000-4000-8000-000000000001', 'semanal'),
  ('f0000002-0000-4000-8000-000000000002', 'quincenal'),
  ('f0000003-0000-4000-8000-000000000003', 'mensual')
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

COMMIT;

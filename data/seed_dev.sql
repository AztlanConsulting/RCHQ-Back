-- ============================================================
-- SEED MINIMAL â€” RCHQ
-- Login: andre@gmail.com / Andatti67
-- Login: laura.mantenimiento@gmail.com / Andatti67
-- desarrollo
-- Re-run safe: todos los inserts tienen ON CONFLICT DO NOTHING
-- ============================================================

-- =========================
-- HOUSES
-- =========================
INSERT INTO public.house (house_id, name, location, phone_number, description, image)
VALUES 
('a0000001-0000-4000-8000-000000000001', 'Casa MarÃ­a Goretti I.A.P', 'QuerÃ©taro, Qro.', '4420000012', 'AtenciÃ³n especializada', 'default_house'),
('a0000001-0000-4000-8000-000000000002', 'SonrÃ­e villa infantil', 'QuerÃ©taro, Qro.', '4420000001', 'InstituciÃ³n de asistencia infantil', 'default_house'),
('a0000001-0000-4000-8000-000000000003', 'Ammi casa infantil', 'QuerÃ©taro, Qro.', '4420000002', 'Hogar para niÃ±os y niÃ±as', 'default_house'),
('a0000001-0000-4000-8000-000000000004', 'Casa Hogar Esperanza Para ti', 'QuerÃ©taro, Qro.', '4420000003', 'Apoyo integral a la infancia', 'default_house'),
('a0000001-0000-4000-8000-000000000005', 'Hogar juvenil del santisimo rendentor I.A.P', 'QuerÃ©taro, Qro.', '4420000004', 'Hogar juvenil', 'default_house'),
('a0000001-0000-4000-8000-000000000006', 'La AlegrÃ­a de los niÃ±os', 'QuerÃ©taro, Qro.', '4420000005', 'I.A.P. dedicada al cuidado infantil', 'default_house'),
('a0000001-0000-4000-8000-000000000007', 'Casa de JesÃºs', 'QuerÃ©taro, Qro.', '4420000006', 'Asistencia social infantil', 'default_house'),
('a0000001-0000-4000-8000-000000000008', 'Ministerios Pan de Vida', 'QuerÃ©taro, Qro.', '4420000007', 'Apoyo y refugio infantil', 'default_house'),
('a0000001-0000-4000-8000-000000000009', 'Hogares Providencia de QuerÃ©taro', 'QuerÃ©taro, Qro.', '4420000008', 'ProtecciÃ³n a niÃ±os en situaciÃ³n de calle', 'default_house'),
('a0000001-0000-4000-8000-000000000010', 'Proyecto de Vida I.A.P', 'QuerÃ©taro, Qro.', '4420000009', 'Desarrollo humano y social', 'default_house'),
('a0000001-0000-4000-8000-000000000011', 'Puerta Abierta I.A.P', 'QuerÃ©taro, Qro.', '4420000010', 'AtenciÃ³n a niÃ±as y adolescentes', 'default_house'),
('a0000001-0000-4000-8000-000000000012', 'Senderos I.A.P', 'QuerÃ©taro, Qro.', '4420000011', 'Camino a una vida digna', 'default_house')
ON CONFLICT DO NOTHING;


-- =========================
-- EMPLOYEE EXTRA ACCOUNTS
-- Coordinadores reales, cuentas Paloma Cervantes por casa y empleados de prueba
-- ContraseÃ±a: Hola12345
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
  (SELECT house_id FROM public.house WHERE phone_number = '4420000002' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Lucrecia',
  'Garduno',
  true,
  'lucrecia.garduno@gmail.com',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'GAVL710421MDFRLC04',
  NULL,
  NULL,
  NULL,
  '2014-10-14',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000012' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'MarÃ­a de Lourdes',
  'Aguilar',
  true,
  'direccion@casamariagoretti.org',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'AUEL791205MDFGNR07',
  NULL,
  NULL,
  NULL,
  '2015-11-09',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000012' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'GÃ©nesis',
  'FernÃ¡ndez',
  true,
  'casamariagorettifacturas@hotmail.com',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'FETG901122MCLRGN06',
  NULL,
  NULL,
  NULL,
  '2022-07-03',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000011' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Matilde',
  'Merodio',
  true,
  'atencion@senderosiap.org',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'MERM710128MNERVT05',
  NULL,
  NULL,
  NULL,
  '2023-01-02',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000011' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'ELDA NURY',
  'ARGÃEZ',
  true,
  'nurysanchez15@yahoo.com',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'AASE751128MYNRNL04',
  NULL,
  NULL,
  NULL,
  '2024-06-01',
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
  'Geraldine',
  'Iturbero',
  true,
  'direccionadministrativa@villainfantiliap.org',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'IUCA860507MQTTMM00',
  NULL,
  NULL,
  NULL,
  '2017-02-01',
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
  'Elizabeth',
  'ZÃºÃ±iga',
  true,
  'esperanzaparati1@hotmail.com',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'ZUAE920609MQTXLL04',
  NULL,
  NULL,
  NULL,
  '2025-09-09',
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
  'Maribel',
  'Silva',
  true,
  'contabilidad@esperanzaparati.org',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'SIRM760128MGRLSR04',
  NULL,
  NULL,
  NULL,
  '2025-03-18',
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
  'ROKZANA ALMARAZ',
  'FLORES',
  true,
  'CONTACTO@HOGARJUVENIL.ORG',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'AAFR820620MHGLLK06',
  NULL,
  NULL,
  NULL,
  '2024-07-09',
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
  'Brenda Daniela',
  'ChÃ¡vez',
  true,
  'bchavez@grupoarcum.com',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CAMB950226MQTHRR04',
  NULL,
  NULL,
  NULL,
  '2022-01-03',
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
  'Yeny',
  'Santiago',
  true,
  'coordinacion@proyectodevida.org.mx',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'SASY831228MGRNLN08',
  NULL,
  NULL,
  NULL,
  '2024-01-01',
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
  'Blanca Graciela',
  'BaÃ±uelos',
  true,
  'administracion@casahogarpandevida.org',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'BAMB740831MJCXZL00',
  NULL,
  NULL,
  NULL,
  '2019-08-27',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000012' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Paloma',
  'Cervantes',
  true,
  'admin.goretti@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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
  'Paloma',
  'Cervantes',
  true,
  'admin.sonrie@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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
  'Paloma',
  'Cervantes',
  true,
  'admin.ammi@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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
  'Paloma',
  'Cervantes',
  true,
  'admin.esperanza@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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
  'Paloma',
  'Cervantes',
  true,
  'admin.hogarjuvenil@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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
  'Paloma',
  'Cervantes',
  true,
  'admin.alegria@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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
  'Paloma',
  'Cervantes',
  true,
  'admin.casadejesus@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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
  'Paloma',
  'Cervantes',
  true,
  'admin.pandevida@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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
  'Paloma',
  'Cervantes',
  true,
  'admin.providencia@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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
  'Paloma',
  'Cervantes',
  true,
  'admin.proyectovida@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000010' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Paloma',
  'Cervantes',
  true,
  'admin.puertaabierta@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  gen_random_uuid(),
  (SELECT house_id FROM public.house WHERE phone_number = '4420000011' LIMIT 1),
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Paloma',
  'Cervantes',
  true,
  'admin.senderos@rchq.cloud',
  '$2b$10$OioDH3jk0w6HSdKiaX/uOuFBcRqo97mvskwpPeALL7ntUZjjAVUsC',
  false,
  0,
  NULL,
  'CERP880323MQTRYL04',
  NULL,
  NULL,
  NULL,
  '2019-04-01',
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

-- =========================
-- ROLES
-- =========================
INSERT INTO public.role (role_id, name)
VALUES 
('a0000002-0000-4000-8000-000000000001', 'Coordinador'),
('a0000002-0000-4000-8000-000000000002', 'Administrador'),
('a0000002-0000-4000-8000-000000000003', 'Mantenimiento'),
('a0000002-0000-4000-8000-000000000004', 'LavanderÃ­a'),
('a0000002-0000-4000-8000-000000000005', 'Cuidador'),
('a0000002-0000-4000-8000-000000000006', 'PsicÃ³loga'),
('a0000002-0000-4000-8000-000000000007', 'PsicÃ³logo'),
('a0000002-0000-4000-8000-000000000008', 'Trabajador Social'),
('a0000002-0000-4000-8000-000000000009', 'Coordinador Operativo'),
('a0000002-0000-4000-8000-000000000010', 'Coordinador Administrativo'),
('a0000002-0000-4000-8000-000000000011', 'Coordinador de Programa'),
('a0000002-0000-4000-8000-000000000012', 'DirecciÃ³n Operativa'),
('a0000002-0000-4000-8000-000000000013', 'DirecciÃ³n Administrativa'),
('a0000002-0000-4000-8000-000000000014', 'DirecciÃ³n de Programa'),
('a0000002-0000-4000-8000-000000000015', 'ProcuraciÃ³n de Fondos'),
('a0000002-0000-4000-8000-000000000016', 'Enfermera'),
('a0000002-0000-4000-8000-000000000017', 'Terapeuta'),
('a0000002-0000-4000-8000-000000000018', 'Asistente de DirecciÃ³n'),
('a0000002-0000-4000-8000-000000000019', 'Asistente de Finanzas'),
('a0000002-0000-4000-8000-000000000020', 'Auxiliar de Limpieza'),
('a0000002-0000-4000-8000-000000000021', 'Auxiliar de LavanderÃ­a'),
('a0000002-0000-4000-8000-000000000022', 'Chofer'),
('a0000002-0000-4000-8000-000000000023', 'Cocinera'),
('a0000002-0000-4000-8000-000000000024', 'Asistente Operativo'),
('a0000002-0000-4000-8000-000000000025', 'Asistente Administrativo'),
('a0000002-0000-4000-8000-000000000026', 'Intendencia'),
('a0000002-0000-4000-8000-000000000027', 'Presidente'),
('a0000002-0000-4000-8000-000000000028', 'Vicepresidente'),
('a0000002-0000-4000-8000-000000000029', 'Tesorero'),
('a0000002-0000-4000-8000-000000000030', 'Vocal'),
('a0000002-0000-4000-8000-000000000031', 'Proveedor')
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
('00000001-0000-4000-8000-000000000007', 'viewEvents'),
('00000001-0000-4000-8000-000000000012', 'addToBlacklist'),
('00000001-0000-4000-8000-000000000008', 'createEvent'),
('00000001-0000-4000-8000-000000000009', 'editAbsences'),
('00000001-0000-4000-8000-000000000010', 'deleteAbsences'),
('00000001-0000-4000-8000-000000000011', 'addAbsences'),
('00000001-0000-4000-8000-000000000013', 'deleteEvent'),
('00000001-0000-4000-8000-000000000014', 'editEvent'),
('00000001-0000-4000-8000-000000000015', 'viewBlacklist'),
('00000001-0000-4000-8000-000000000016', 'removeFromBlacklist'),
('00000001-0000-4000-8000-000000000017', 'viewSelfVacations'),
('00000001-0000-4000-8000-000000000018', 'editVacations')
ON CONFLICT DO NOTHING;

-- =========================
-- ROLE_PRIVILEGE
-- =========================

-- Administrador â€” todos los privilegios
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT 'a0000002-0000-4000-8000-000000000002', privilege_id
FROM public.privileges
ON CONFLICT DO NOTHING;

-- Coordinador â€” gestiÃ³n completa incluyendo logs
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT 'a0000002-0000-4000-8000-000000000001', p.privilege_id
FROM public.privileges p
WHERE p.name IN ('viewEmployees', 'createEmployees', 'manageEmployees', 'viewDocuments', 'manageDocuments', 'viewLogs', 'addToBlacklist', 'viewBlacklist', 'removeFromBlacklist')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT 'a0000002-0000-4000-8000-000000000001', p.privilege_id
FROM public.privileges p
WHERE p.name = 'editAbsences'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT 'a0000002-0000-4000-8000-000000000002', p.privilege_id
FROM public.privileges p
WHERE p.name = 'editAbsences'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT 'a0000002-0000-4000-8000-000000000001', p.privilege_id
FROM public.privileges p
WHERE p.name = 'deleteAbsences'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT 'a0000002-0000-4000-8000-000000000002', p.privilege_id
FROM public.privileges p
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

-- Coordinadores de Ã¡rea â€” ver empleados y documentos
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE r.name IN ('Coordinador Operativo', 'Coordinador Administrativo', 'Coordinador de Programa')
AND p.name IN ('viewEmployees', 'viewDocuments')
ON CONFLICT DO NOTHING;

-- Direcciones â€” ver empleados, documentos y logs
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE r.name IN ('DirecciÃ³n Operativa', 'DirecciÃ³n Administrativa', 'DirecciÃ³n de Programa')
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
-- ContraseÃ±a: Andatti67
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
  (SELECT house_id FROM public.house  WHERE name = 'Casa MarÃ­a Goretti I.A.P' LIMIT 1),
  (SELECT role_id  FROM public.role   WHERE name = 'Administrador'      LIMIT 1),
  'Carlos',
  'RamÃ­rez',
  true,
  'andre@gmail.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  0,
  NULL,
  'XAXX010101HDFXXX01',
  NULL,
  '2003-10-04',
  'uploads/1776813289924.png',
  '2026-04-09',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
), (
  'b8f54b14-701e-4e87-a019-caef53dcda70',
  (SELECT house_id FROM public.house  WHERE name = 'Casa MarÃ­a Goretti I.A.P' LIMIT 1),
  (SELECT role_id  FROM public.role   WHERE name = 'Mantenimiento' LIMIT 1),
  'Laura',
  'Mendoza',
  true,
  'laura.mantenimiento@gmail.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  0,
  NULL,
  'MEML900101MDFNDR01',
  NULL,
  '1990-01-01',
  NULL,
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
('auth-001', 'Intento fallido de autenticaciÃ³n', false),
('auth-002', 'Cuenta bloqueada temporalmente por mÃºltiples intentos fallidos', false),
('auth-003', 'Inicio de sesiÃ³n exitoso', false),
('auth-004', 'Primer acceso validado, pendiente cambio de contraseÃ±a', false),
('auth-005', 'Cambio de contraseÃ±a en primer acceso', false),
('auth-006', 'Inicio de sesiÃ³n completado despuÃ©s de cambio de contraseÃ±a en primer acceso', false),
('auth-007', 'ActivaciÃ³n exitosa de TwoFactorAuth', false),
('auth-008', 'ActivaciÃ³n fallida de TwoFactorAuth', false),
('auth-009', 'Fallo de autenticaciÃ³n TwoFactorAuth', false),
('auth-010', 'Inicio de sesiÃ³n exitoso con TwoFactorAuth', false),
('auth-011', 'DesactivaciÃ³n exitosa de TwoFactorAuth', false),
('auth-012', 'Intento de acceso denegado: usuario inactivo', false),
('auth-013', 'Intento de cambio de contraseÃ±a en primer acceso para usuario inactivo', false),
('auth-014', 'Intento de configuraciÃ³n de TwoFactorAuth para usuario inactivo', false),
('auth-015', 'Intento de verificaciÃ³n TwoFactorAuth para usuario inactivo', false),
('auth-016', 'Intento de validaciÃ³n de TwoFactorAuth para usuario inactivo', false),
('auth-017', 'Intento de desactivaciÃ³n de TwoFactorAuth para usuario inactivo', false),
('auth-018', 'Fallo de desactivaciÃ³n de TwoFactorAuth por contraseÃ±a incorrecta', false),
('auth-019', 'TwoFactorAuth bloqueado temporalmente por mÃºltiples intentos fallidos', false),
('auth-020', 'Cambio de contraseÃ±a exitoso', false),
('auth-021', 'Intento de cambio de contraseÃ±a para usuario inactivo', false),
('auth-022', 'Fallo de cambio de contraseÃ±a por contraseÃ±a actual incorrecta', false),
('vaca-001', 'CreaciÃ³n de solicitud de vacaciones exitosa', false),
('vaca-002', 'Registro de vacaciones de empleado exitoso', false),
('vaca-003', 'AprobaciÃ³n de solicitud de vacaciones exitosa', false),
('ausn-003', 'CreaciÃ³n de ausencia exitosa', false),
('ausn-001', 'ActualizaciÃ³n de ausencia exitosa', false),
('ausn-002', 'EliminaciÃ³n de ausencia exitosa', false),
('vaca-004', 'Rechazo de solicitud de vacaciones exitoso', false),
('even-001', 'Evento de casa creado con Ã©xito', false),
('even-002', 'Evento personal creado con Ã©xito', false),
('even-003', 'Evento personal asignado a empleado', false),
('even-004', 'Evento de casa asignado a casa', false),
('even-007', 'ActualizaciÃ³n de evento personal exitosa', false),
('even-008', 'ActualizaciÃ³n de empleado asignado a evento personal', false),
('even-005', 'Evento de casa eliminado con Ã©xito', true),
('even-006', 'ActualizaciÃ³n de evento de casa exitosa', false),
('empl-001', 'Empleado creado con Ã©xito', false),
('empl-002', 'Documento de empleado subido', false),
('empl-003', 'Documento de empleado actualizado', false),
('empl-004', 'Documento de empleado eliminado', false),
('empl-005', 'InformaciÃ³n de empleado actualizada', false),
('vaca-005', 'ModificaciÃ³n de vacaciones exitosa', false),
('empl-006', 'Empleado dado de baja', true),
('empl-008', 'Fallo al dar de baja al empleado', true),
('vaca-006', 'EliminaciÃ³n de vacaciones exitosa', false),
('blck-001', 'Empleado agregado a la lista negra', true),
('blck-002', 'Empleado eliminado de la lista negra', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.workday (workday_id, name)
VALUES
('c0000001-0000-4000-8000-000000000001', 'Lunes'),
('c0000001-0000-4000-8000-000000000002', 'Martes'),
('c0000001-0000-4000-8000-000000000003', 'MiÃ©rcoles'),
('c0000001-0000-4000-8000-000000000004', 'Jueves'),
('c0000001-0000-4000-8000-000000000005', 'Viernes'),
('c0000001-0000-4000-8000-000000000006', 'SÃ¡bado'),
('c0000001-0000-4000-8000-000000000007', 'Domingo');

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day) VALUES
(gen_random_uuid(), (SELECT employee_id FROM public.employee LIMIT 1), 'c0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', '09:00:00', '18:00:00', false),
(gen_random_uuid(), (SELECT employee_id FROM public.employee LIMIT 1), 'c0000001-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000002', '09:00:00', '18:00:00', false),
(gen_random_uuid(), (SELECT employee_id FROM public.employee LIMIT 1), 'c0000001-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000003', '09:00:00', '18:00:00', false),
(gen_random_uuid(), (SELECT employee_id FROM public.employee LIMIT 1), 'c0000001-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000004', '09:00:00', '18:00:00', false),
(gen_random_uuid(), (SELECT employee_id FROM public.employee LIMIT 1), 'c0000001-0000-4000-8000-000000000005', 'c0000001-0000-4000-8000-000000000005', '09:00:00', '18:00:00', false);

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
VALUES
(gen_random_uuid(), (SELECT employee_id FROM public.employee WHERE email = 'laura.mantenimiento@gmail.com'), 'c0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', '09:00:00', '18:00:00', false),
(gen_random_uuid(), (SELECT employee_id FROM public.employee WHERE email = 'laura.mantenimiento@gmail.com'), 'c0000001-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000002', '09:00:00', '18:00:00', false),
(gen_random_uuid(), (SELECT employee_id FROM public.employee WHERE email = 'laura.mantenimiento@gmail.com'), 'c0000001-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000003', '09:00:00', '18:00:00', false),
(gen_random_uuid(), (SELECT employee_id FROM public.employee WHERE email = 'laura.mantenimiento@gmail.com'), 'c0000001-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000004', '09:00:00', '18:00:00', false),
(gen_random_uuid(), (SELECT employee_id FROM public.employee WHERE email = 'laura.mantenimiento@gmail.com'), 'c0000001-0000-4000-8000-000000000005', 'c0000001-0000-4000-8000-000000000005', '09:00:00', '18:00:00', false);

INSERT INTO public.event_type (event_type_id, name)
VALUES
('b1000000-0000-4000-8000-000000000001', 'General'),
('b1000000-0000-4000-8000-000000000002', 'Visita'),
('b1000000-0000-4000-8000-000000000003', 'Tarea'),
('b1000000-0000-4000-8000-000000000004', 'Capacitaciones')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.global_event (
  global_event_id,
  event_type_id,
  start,
  "end",
  name,
  description,
  all_day,
  is_free_day
)
VALUES (
  'c1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  '2026-05-01 09:00:00',
  '2026-05-01 17:00:00',
  'Aniversario',
  'Aniversario de la red de casas hogar',
  false,
  false
), (
  'c1000000-0000-4000-8000-000000000010',
  'b1000000-0000-4000-8000-000000000001',
  '2026-05-05 09:00:00',
  '2026-05-05 17:00:00',
  'Descanso global de prueba',
  'Evento global libre para validar descuento de ausencias de Laura',
  true,
  true
), (
  'c1000000-0000-4000-8000-000000000011',
  'b1000000-0000-4000-8000-000000000001',
  '2026-05-20 09:00:00',
  '2026-05-20 17:00:00',
  'Jornada global libre',
  'Segundo evento global libre para validar conteo de dias habiles',
  true,
  true
)
ON CONFLICT (global_event_id) DO NOTHING;

INSERT INTO public.house_event (
  house_event_id,
  event_type_id,
  house_id,
  start,
  "end",
  name,
  description,
  all_day,
  is_free_day
)
VALUES (
  'c2000000-0000-4000-8000-000000000002',
  'b1000000-0000-4000-8000-000000000001',
  (SELECT house_id FROM public.house WHERE name = 'Casa MarÃ­a Goretti I.A.P' LIMIT 1),
  '2026-05-03 10:00:00',
  '2026-05-03 12:00:00',
  'Visita DIF',
  'Visita por parte del DIF para ver las instalaciones',
  false,
  false
), (
  'c2000000-0000-4000-8000-000000000010',
  'b1000000-0000-4000-8000-000000000001',
  (SELECT house_id FROM public.house WHERE name = 'Casa MarÃ­a Goretti I.A.P' LIMIT 1),
  '2026-05-07 09:00:00',
  '2026-05-07 17:00:00',
  'Descanso de casa de prueba',
  'Evento de casa libre para validar descuento de ausencias de Laura',
  true,
  true
), (
  'c2000000-0000-4000-8000-000000000011',
  'b1000000-0000-4000-8000-000000000001',
  (SELECT house_id FROM public.house WHERE name = 'Casa MarÃ­a Goretti I.A.P' LIMIT 1),
  '2026-05-21 09:00:00',
  '2026-05-21 17:00:00',
  'Jornada libre de casa',
  'Segundo evento de casa libre para validar conteo de dias habiles',
  true,
  true
)
ON CONFLICT (house_event_id) DO NOTHING;

INSERT INTO public.personal_event (
  personal_event_id,
  event_type_id,
  date,
  start,
  "end",
  name,
  description,
  all_day
)
VALUES (
  'c3000000-0000-4000-8000-000000000003',
  'b1000000-0000-4000-8000-000000000001',
  '2026-05-04',
  '2026-01-01 21:00:00',
  '2026-01-01 22:00:00',
  'Visita mÃ©dica',
  'Se tiene que llevar a Juan PÃ©rez al doctor',
  false
)
ON CONFLICT (personal_event_id) DO NOTHING;

INSERT INTO public.employee_personal_event (
  personal_event_id,
  employee_id
)
VALUES (
  'c3000000-0000-4000-8000-000000000003',
  (SELECT employee_id FROM public.employee WHERE email = 'andre@gmail.com' LIMIT 1)
)
ON CONFLICT DO NOTHING;

INSERT INTO public.employee_personal_event (
  personal_event_id,
  employee_id
)
VALUES (
  'c3000000-0000-4000-8000-000000000003',
  (SELECT employee_id FROM public.employee WHERE email = 'andre@gmail.com')
)
ON CONFLICT DO NOTHING;

INSERT INTO public.personal_event (
  personal_event_id,
  event_type_id,
  date,
  start,
  "end",
  name,
  description,
  all_day,
  trainer
)
VALUES (
  'c3000000-0000-4000-8000-000000000025',
  (SELECT event_type_id FROM public.event_type WHERE name = 'Capacitaciones' LIMIT 1),
  '2026-05-25',
  '2026-05-25 10:00:00',
  '2026-05-25 12:00:00',
  'CapacitaciÃ³n de prueba',
  'Evento personal de prueba para validar ediciÃ³n solo de eventos',
  false,
  'Capacitador de prueba'
), (
  'c3000000-0000-4000-8000-000000000026',
  (SELECT event_type_id FROM public.event_type WHERE name = 'Capacitaciones' LIMIT 1),
  '2026-05-27',
  '2026-05-27 09:00:00',
  '2026-05-27 11:00:00',
  'CapacitaciÃ³n de seguridad interna',
  'SesiÃ³n para reforzar protocolos de seguridad y atenciÃ³n cotidiana',
  false,
  'Capacitador de seguridad'
), (
  'c3000000-0000-4000-8000-000000000027',
  (SELECT event_type_id FROM public.event_type WHERE name = 'Capacitaciones' LIMIT 1),
  '2026-05-29',
  '2026-05-29 12:00:00',
  '2026-05-29 14:00:00',
  'CapacitaciÃ³n de manejo de crisis',
  'Taller para practicar respuesta coordinada ante incidentes y escalaciones',
  false,
  'Capacitadora clÃ­nica'
), (
  'c3000000-0000-4000-8000-000000000028',
  (SELECT event_type_id FROM public.event_type WHERE name = 'Capacitaciones' LIMIT 1),
  '2026-06-02',
  '2026-06-02 08:30:00',
  '2026-06-02 10:30:00',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'PrÃ¡ctica enfocada en seguimiento de instrucciones y reporte entre turnos',
  false,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
)
ON CONFLICT (personal_event_id) DO NOTHING;

-- =========================
-- DOCUMENTOS
-- =========================

INSERT INTO public.documents (document_id, name)
VALUES
('c0000001-0000-4000-8000-000000000001', 'Curriculum Vitae'),
('c0000001-0000-4000-8000-000000000002', 'Acta de Nacimiento'),
('c0000001-0000-4000-8000-000000000003', 'CURP'),
('c0000001-0000-4000-8000-000000000004', 'INE'),
('c0000001-0000-4000-8000-000000000005', 'Constancia de SituaciÃ³n Fiscal'),
('c0000001-0000-4000-8000-000000000006', 'Comprobante de Domicilio'),
('c0000001-0000-4000-8000-000000000007', 'NÃºmero IMSS / NSS'),
('c0000001-0000-4000-8000-000000000008', 'CÃ©dula Profesional'),
('c0000001-0000-4000-8000-000000000009', 'TÃ­tulo o Comprobante de Ãšltimo Nivel de Estudios'),
('c0000001-0000-4000-8000-000000000010', 'Certificado MÃ©dico'),
('c0000001-0000-4000-8000-000000000011', 'Carta de No Antecedentes Penales Estatal'),
('c0000001-0000-4000-8000-000000000012', 'Carta de No Antecedentes Penales Federal'),
('c0000001-0000-4000-8000-000000000013', 'Cuenta Bancaria'),
('c0000001-0000-4000-8000-000000000014', 'Carta de RecomendaciÃ³n 1'),
('c0000001-0000-4000-8000-000000000015', 'Carta de RecomendaciÃ³n 2'),
('c0000001-0000-4000-8000-000000000016', 'Licencia de Manejo'),
('c0000001-0000-4000-8000-000000000017', 'Perfil del Puesto / Manual de Puesto'),
('c0000001-0000-4000-8000-000000000018', 'Contrato'),
('c0000001-0000-4000-8000-000000000019', 'Reglamento Interno de Trabajo Firmado'),
('c0000001-0000-4000-8000-000000000020', 'Carta de Confidencialidad Firmada'),
('c0000001-0000-4000-8000-000000000021', 'CÃ³digo de Ã‰tica Firmado'),
('c0000001-0000-4000-8000-000000000022', 'Manual de InducciÃ³n'),
('c0000001-0000-4000-8000-000000000023', 'Comprobante de Domicilio ActualizaciÃ³n Semestral'),
('c0000001-0000-4000-8000-000000000024', 'Constancia de CapacitaciÃ³n o CertificaciÃ³n'),
('c0000001-0000-4000-8000-000000000025', 'Acta Administrativa 1'),
('c0000001-0000-4000-8000-000000000026', 'Acta Administrativa 2'),
('c0000001-0000-4000-8000-000000000027', 'Acta Administrativa 3'),
('c0000001-0000-4000-8000-000000000028', 'Contacto de Emergencia 1'),
('c0000001-0000-4000-8000-000000000029', 'Contacto de Emergencia 2'),
('c0000001-0000-4000-8000-000000000030', 'Hoja de RetenciÃ³n de INFONAVIT'),
('c0000001-0000-4000-8000-000000000031', 'Carta Solicitud de la Escuela / Universidad (Servicio Social)'),
('c0000001-0000-4000-8000-000000000032', 'Carta de Voluntariado'),
('c0000001-0000-4000-8000-000000000033', 'Norma del Voluntario (Ley General de Voluntariado)'),
('c0000001-0000-4000-8000-000000000034', 'Plan de Voluntariado'),
('c0000001-0000-4000-8000-000000000035', 'Aviso de Privacidad'),
('c0000001-0000-4000-8000-000000000036', 'IdentificaciÃ³n de la Universidad'),
('c0000001-0000-4000-8000-000000000037', 'Reportes Voluntarios / Servicio Social'),
('c0000001-0000-4000-8000-000000000038', 'Carta de AcreditaciÃ³n de Horas'),
('c0000001-0000-4000-8000-000000000039', 'EvaluaciÃ³n de DesempeÃ±o'),
('c0000001-0000-4000-8000-000000000040', 'Pruebas PsicomÃ©tricas o PsicolÃ³gicas'),
('c0000001-0000-4000-8000-000000000041', 'Carta de Renuncia'),
('c0000001-0000-4000-8000-000000000042', 'Finiquito Firmado'),
('c0000001-0000-4000-8000-000000000043', 'Carta de Despido'),
('c0000001-0000-4000-8000-000000000044', 'Carta de RecepciÃ³n de Equipo de Trabajo o Uniforme'),
('c0000001-0000-4000-8000-000000000045', 'Permiso de Trabajo (para extranjeros)')
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
  'Casa MarÃ­a Goretti I.A.P',
  'QuerÃ©taro, Qro.',
  '4420000012',
  'AtenciÃ³n especializada',
  'default_house'
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
    'Retraso a reuniÃ³n de equipo (15 min)'
  ),
  (
    'd0000002-0000-4000-8000-000000000002',
    CURRENT_DATE - INTERVAL '45 days',
    'Falta justificada con certificado mÃ©dico'
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
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Administrador' LIMIT 1),
  'MarÃ­a',
  'GonzÃ¡lez',
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
  '5555551002',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.employee WHERE employee_id = 'e0000001-0000-4000-8000-000000000001'
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
  bank_account,
  type
)
SELECT
  'e0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Luis',
  'MartÃ­nez',
  true,
  'luis.coordinacion@example.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  true,
  false,
  0,
  0,
  NULL,
  'MALR900205HDFRRS09',
  NULL,
  '1990-02-05',
  NULL,
  '2025-02-03',
  NULL,
  '5555551003',
  NULL,
  NULL,
  'nomina'
WHERE NOT EXISTS (
  SELECT 1 FROM public.employee WHERE employee_id = 'e0000001-0000-4000-8000-000000000002'
);

UPDATE public.employee
SET
  house_id = COALESCE(
    (SELECT house_id FROM public.house WHERE house_id = 'a0000001-0000-4000-8000-000000000001'),
    house_id
  ),
  phone_number = COALESCE(phone_number, '4424792232')
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
  'Benito JuÃ¡rez',
  'Ciudad de MÃ©xico',
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

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT 'c0000001-0000-4000-8000-000000000001', e.employee_id, '08:00:00', '17:00:00'
FROM public.employee e WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT 'c0000001-0000-4000-8000-000000000002', e.employee_id, '09:00:00', '18:00:00'
FROM public.employee e WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT 'c0000001-0000-4000-8000-000000000004', e.employee_id, '07:00:00', '16:00:00'
FROM public.employee e WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT 'c0000001-0000-4000-8000-000000000005', e.employee_id, '10:00:00', '19:00:00'
FROM public.employee e WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT 'c0000001-0000-4000-8000-000000000001', e.employee_id, '08:00:00', '17:00:00'
FROM public.employee e WHERE e.email = 'luis.coordinacion@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT 'c0000001-0000-4000-8000-000000000002', e.employee_id, '08:00:00', '17:00:00'
FROM public.employee e WHERE e.email = 'luis.coordinacion@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT 'c0000001-0000-4000-8000-000000000003', e.employee_id, '08:00:00', '17:00:00'
FROM public.employee e WHERE e.email = 'luis.coordinacion@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT 'c0000001-0000-4000-8000-000000000004', e.employee_id, '08:00:00', '17:00:00'
FROM public.employee e WHERE e.email = 'luis.coordinacion@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT 'c0000001-0000-4000-8000-000000000005', e.employee_id, '08:00:00', '17:00:00'
FROM public.employee e WHERE e.email = 'luis.coordinacion@example.com'
ON CONFLICT (workday_id, employee_id) DO UPDATE SET start = EXCLUDED.start, "end" = EXCLUDED."end";

INSERT INTO public.absence_type (absence_type_id, name)
VALUES
('a0000001-0000-4000-8000-000000000001', 'MÃ©dica'),
('a0000001-0000-4000-8000-000000000002', 'Paternidad'),
('a0000001-0000-4000-8000-000000000003', 'Maternidad'),
('a0000001-0000-4000-8000-000000000004', 'Otro')
ON CONFLICT DO NOTHING;

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
SELECT
  'a1000001-0000-4000-8000-000000000001',
  e.employee_id,
  'a0000001-0000-4000-8000-000000000001',
  '2026-05-12',
  '2026-05-14',
  'Incapacidad mÃ©dica de seguimiento para revisiÃ³n postoperatoria.',
  '',
  false
FROM public.employee e
WHERE e.email = 'maria.operaciones@example.com'
ON CONFLICT (absence_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  absence_type_id = EXCLUDED.absence_type_id,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  is_deleted = EXCLUDED.is_deleted;

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
SELECT
  'a1000001-0000-4000-8000-000000000002',
  e.employee_id,
  'a0000001-0000-4000-8000-000000000002',
  '2026-05-18',
  '2026-05-22',
  'Permiso por paternidad del coordinador de la Casa MarÃ­a Goretti I.A.P.',
  '',
  false
FROM public.employee e
WHERE e.email = 'luis.coordinacion@example.com'
ON CONFLICT (absence_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  absence_type_id = EXCLUDED.absence_type_id,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  is_deleted = EXCLUDED.is_deleted;

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
(
  'ab000001-0000-4000-8000-000000000001',
  'b8f54b14-701e-4e87-a019-caef53dcda99',
  'a0000001-0000-4000-8000-000000000001',
  '2026-05-01',
  '2026-05-05',
  'Consulta medica y reposo indicado',
  '',
  false
),
(
  'ab000001-0000-4000-8000-000000000002',
  'b8f54b14-701e-4e87-a019-caef53dcda99',
  'a0000001-0000-4000-8000-000000000002',
  '2026-05-12',
  '2026-05-12',
  'Permiso por tramite familiar',
  '',
  false
),
(
  'ab000001-0000-4000-8000-000000000003',
  'b8f54b14-701e-4e87-a019-caef53dcda99',
  'a0000001-0000-4000-8000-000000000001',
  '2026-06-18',
  '2026-06-19',
  'Seguimiento medico programado',
  '',
  false
),
(
  'ab000001-0000-4000-8000-000000000010',
  'b8f54b14-701e-4e87-a019-caef53dcda70',
  'a0000001-0000-4000-8000-000000000001',
  '2026-05-01',
  '2026-05-08',
  'Reposo de Laura con cruce de evento global y evento de casa',
  '',
  false
),
(
  'ab000001-0000-4000-8000-000000000011',
  'b8f54b14-701e-4e87-a019-caef53dcda70',
  'a0000001-0000-4000-8000-000000000002',
  '2026-05-20',
  '2026-05-22',
  'Permiso de Laura con dos eventos libres de mayo',
  '',
  false
)
ON CONFLICT (absence_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  absence_type_id = EXCLUDED.absence_type_id,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  is_deleted = EXCLUDED.is_deleted;

INSERT INTO PUBLIC.frecuency_of_payment (
  frecuency_of_payment_id,
  name
) VALUES
  ('f0000001-0000-4000-8000-000000000001', 'semanal'),
  ('f0000002-0000-4000-8000-000000000002', 'quincenal'),
  ('f0000003-0000-4000-8000-000000000003', 'mensual')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED MANUAL US30 â€” Modificar fechas de vacaciones
-- Password todos: Andatti67
-- ============================================================

-- AcciÃ³n requerida por logs de US30
INSERT INTO public.action (action_id, description, important)
VALUES (
  'vaca-005',
  'ModificaciÃ³n de vacaciones exitosa',
  false
)
ON CONFLICT (action_id) DO UPDATE SET
  description = EXCLUDED.description,
  important = EXCLUDED.important;

-- AcciÃ³n requerida por logs de US32
INSERT INTO public.action (action_id, description, important)
VALUES (
  'vaca-006',
  'EliminaciÃ³n de vacaciones exitosa',
  false
)
ON CONFLICT (action_id) DO UPDATE SET
  description = EXCLUDED.description,
  important = EXCLUDED.important;

-- Coordinador Maria Goretti para US30
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Coordinador',
  'US30',
  true,
  'coordinador.us30@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE80',
  NULL,
  '1990-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- Empleado vÃ¡lido Maria Goretti
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Empleado',
  'Valido US30',
  true,
  'empleado.valido.us30@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE81',
  NULL,
  '1995-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- Empleado de otra casa
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3000001-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Manuel',
  'JÃ­menez',
  true,
  'empleado.otracasa.us30@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE82',
  NULL,
  '1995-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- Empleado sin dÃ­as laborales
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3000001-0000-4000-8000-000000000004',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Empleado',
  'Sin Dias US30',
  true,
  'empleado.sindias.us30@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE83',
  NULL,
  '1995-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- Empleado aislado para casos exitosos US30
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3000001-0000-4000-8000-000000000005',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Empleado',
  'Exitos US30',
  true,
  'empleado.exitos.us30@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE84',
  NULL,
  '1995-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- Empleado aislado para concurrencia US30
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3000001-0000-4000-8000-000000000006',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Empleado',
  'Concurrencia US30',
  true,
  'empleado.concurrencia.us30@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE85',
  NULL,
  '1995-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

INSERT INTO public.employee_personal_event (
  personal_event_id,
  employee_id
)
VALUES (
  'c3000000-0000-4000-8000-000000000025',
  (SELECT employee_id FROM public.employee WHERE name = 'Carlos' AND surname = 'RamÃ­rez' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000025',
  (SELECT employee_id FROM public.employee WHERE name = 'Laura' AND surname = 'Mendoza' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000025',
  (SELECT employee_id FROM public.employee WHERE name = 'Empleado' AND surname = 'Valido US30' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000025',
  (SELECT employee_id FROM public.employee WHERE name = 'Empleado' AND surname = 'Exitos US30' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000026',
  (SELECT employee_id FROM public.employee WHERE name = 'Carlos' AND surname = 'RamÃ­rez' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000026',
  (SELECT employee_id FROM public.employee WHERE name = 'Laura' AND surname = 'Mendoza' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000026',
  (SELECT employee_id FROM public.employee WHERE name = 'Empleado' AND surname = 'Concurrencia US30' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000027',
  (SELECT employee_id FROM public.employee WHERE name = 'Empleado' AND surname = 'Valido US30' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000027',
  (SELECT employee_id FROM public.employee WHERE name = 'Empleado' AND surname = 'Exitos US30' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000027',
  (SELECT employee_id FROM public.employee WHERE name = 'Empleado' AND surname = 'Concurrencia US30' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000028',
  (SELECT employee_id FROM public.employee WHERE name = 'Carlos' AND surname = 'RamÃ­rez' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000028',
  (SELECT employee_id FROM public.employee WHERE name = 'Laura' AND surname = 'Mendoza' LIMIT 1)
), (
  'c3000000-0000-4000-8000-000000000028',
  (SELECT employee_id FROM public.employee WHERE name = 'Empleado' AND surname = 'Exitos US30' LIMIT 1)
)
ON CONFLICT (personal_event_id, employee_id) DO NOTHING;

-- Empleado Administrador aislado para validar que Coordinador no pueda modificar vacaciones de Administrador
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3000001-0000-4000-8000-000000000007',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Administrador' LIMIT 1),
  'Administrador',
  'Aislado US30',
  true,
  'admin.empleado.us30@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE86',
  NULL,
  '1990-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- DÃ­as laborales L-V para empleados US30 que sÃ­ deben tener horario
INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT
  wd.workday_id,
  emp.employee_id,
  '09:00:00'::time,
  '18:00:00'::time
FROM (
  VALUES
    ('c0000001-0000-4000-8000-000000000001'::uuid),
    ('c0000001-0000-4000-8000-000000000002'::uuid),
    ('c0000001-0000-4000-8000-000000000003'::uuid),
    ('c0000001-0000-4000-8000-000000000004'::uuid),
    ('c0000001-0000-4000-8000-000000000005'::uuid)
) AS wd(workday_id)
CROSS JOIN (
  VALUES
    ('e3000001-0000-4000-8000-000000000001'::uuid),
    ('e3000001-0000-4000-8000-000000000002'::uuid),
    ('e3000001-0000-4000-8000-000000000003'::uuid),
    ('e3000001-0000-4000-8000-000000000005'::uuid),
    ('e3000001-0000-4000-8000-000000000006'::uuid),
    ('e3000001-0000-4000-8000-000000000007'::uuid)
) AS emp(employee_id)
ON CONFLICT (workday_id, employee_id) DO UPDATE SET
  start = EXCLUDED.start,
  "end" = EXCLUDED."end";

-- Limpiar datos US30 para que el script manual sea repetible sin tocar datos base de otras US
DELETE FROM public.logs
WHERE affected IN (
  'e3000001-0000-4000-8000-000000000002',
  'e3000001-0000-4000-8000-000000000003',
  'e3000001-0000-4000-8000-000000000004',
  'e3000001-0000-4000-8000-000000000005',
  'e3000001-0000-4000-8000-000000000006',
  'e3000001-0000-4000-8000-000000000007'
)
OR employee_id = 'e3000001-0000-4000-8000-000000000001';

DELETE FROM public.vacations_request
WHERE vacations_request_id::text LIKE 'c3000000-0000-4000-8000-%';

-- Solicitudes US30
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
VALUES
-- Caso exitoso: pendiente modificable
(
  'c3000000-0000-4000-8000-000000000001',
  'e3000001-0000-4000-8000-000000000005',
  '2026-10-06',
  '2026-10-08',
  0,
  NULL,
  NOW(),
  3
),
-- Caso aprobado modificable
(
  'c3000000-0000-4000-8000-000000000002',
  'e3000001-0000-4000-8000-000000000005',
  '2026-10-13',
  '2026-10-14',
  1,
  NULL,
  NOW(),
  2
),
-- Caso rechazado no modificable
(
  'c3000000-0000-4000-8000-000000000003',
  'e3000001-0000-4000-8000-000000000002',
  '2026-10-20',
  '2026-10-21',
  2,
  'No procede',
  NOW(),
  2
),
-- Caso otra casa
(
  'c3000000-0000-4000-8000-000000000004',
  'e3000001-0000-4000-8000-000000000003',
  '2026-10-06',
  '2026-10-08',
  0,
  NULL,
  NOW(),
  3
),
-- Solicitud base aprobada para provocar traslape
(
  'c3000000-0000-4000-8000-000000000007',
  'e3000001-0000-4000-8000-000000000002',
  '2026-11-03',
  '2026-11-05',
  1,
  NULL,
  NOW(),
  3
),
-- Solicitud pendiente que se intentarÃ¡ mover encima de la aprobada anterior
(
  'c3000000-0000-4000-8000-000000000008',
  'e3000001-0000-4000-8000-000000000002',
  '2026-11-10',
  '2026-11-11',
  0,
  NULL,
  NOW(),
  2
),
-- Solicitud para insuficiencia de dÃ­as
(
  'c3000000-0000-4000-8000-000000000009',
  'e3000001-0000-4000-8000-000000000002',
  '2026-12-01',
  '2026-12-02',
  0,
  NULL,
  NOW(),
  2
),
-- Solicitud para fuera de rango
(
  'c3000000-0000-4000-8000-000000000011',
  'e3000001-0000-4000-8000-000000000002',
  '2026-09-01',
  '2026-09-02',
  0,
  NULL,
  NOW(),
  2
),
-- Solicitud para concurrencia
(
  'c3000000-0000-4000-8000-000000000096',
  'e3000001-0000-4000-8000-000000000006',
  '2026-10-27',
  '2026-10-28',
  0,
  NULL,
  NOW(),
  2
),
-- Solicitud para concurrencia en pasado
(
  'c3000000-0000-4000-8000-000000000097',
  'e3000001-0000-4000-8000-000000000006',
  '2026-01-27',
  '2026-01-28',
  2,
  NULL,
  NOW(),
  2
)
ON CONFLICT (vacations_request_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  status = EXCLUDED.status,
  feedback = EXCLUDED.feedback,
  created_at = EXCLUDED.created_at,
  used_days = EXCLUDED.used_days;
-- =========================
-- EMPLEADO DE PRUEBA BLACKLIST
-- ID fijo para usar en pruebas: e0000002-0000-4000-8000-000000000002
-- Coordinador puede agregarlo a la blacklist (misma casa que andre@gmail.com)
-- =========================

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
    type
)
SELECT
    'e0000002-0000-4000-8000-000000000002',
    (SELECT house_id FROM public.house WHERE name = 'Casa MarÃ­a Goretti I.A.P' LIMIT 1),
    (SELECT role_id  FROM public.role  WHERE name = 'Mantenimiento' LIMIT 1),
    'Luis',
    'PÃ©rez',
    true,
    'luis.prueba.blacklist@example.com',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'PELM900101HDFRZS09',
    NULL,
    '1990-01-01',
    NULL,
    '2025-01-01',
    'nomina'
WHERE NOT EXISTS (
    SELECT 1 FROM public.employee WHERE employee_id = 'e0000002-0000-4000-8000-000000000002'
);

-- ============================================================
-- SEED MANUAL US32 â€” Remover vacaciones
-- Password todos: Andatti67
-- ============================================================

-- Casa externa para probar out of scope US32
INSERT INTO public.house (
  house_id,
  name,
  location,
  phone_number,
  description,
  image
)
VALUES (
  'a3200001-0000-4000-8000-000000000001',
  'Casa Externa US32',
  'QuerÃ©taro, Qro.',
  '4423200001',
  'Casa externa para pruebas US32',
  'default_house'
)
ON CONFLICT (house_id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  phone_number = EXCLUDED.phone_number,
  description = EXCLUDED.description,
  image = EXCLUDED.image;

-- AcciÃ³n requerida por logs de US32
INSERT INTO public.action (action_id, description, important)
VALUES (
  'vaca-006',
  'EliminaciÃ³n de vacaciones exitosa',
  false
)
ON CONFLICT (action_id) DO UPDATE SET
  description = EXCLUDED.description,
  important = EXCLUDED.important;

-- Coordinador Maria Goretti US32
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3200001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
  'Coordinador',
  'US32',
  true,
  'coordinador.us32@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE87',
  NULL,
  '1990-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- Usuario sin permisos US32
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3200001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Usuario',
  'Sin Permisos US32',
  true,
  'usuario.sinpermisos.us32@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE88',
  NULL,
  '1995-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- Empleado vÃ¡lido misma casa US32
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3200001-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Empleado',
  'Valido US32',
  true,
  'empleado.valido.us32@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYE89',
  NULL,
  '1995-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- Empleado de otra casa US32
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3200001-0000-4000-8000-000000000004',
  'a3200001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Mantenimiento' LIMIT 1),
  'Empleado',
  'Otra Casa US32',
  true,
  'empleado.otracasa.us32@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYF80',
  NULL,
  '1995-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- Empleado Admin como objetivo US32
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
  nss,
  bank_account,
  blocked_until,
  temp_totp_secret,
  temp_totp_secret_created_at,
  type
)
VALUES (
  'e3200001-0000-4000-8000-000000000005',
  'a0000001-0000-4000-8000-000000000001',
  (SELECT role_id FROM public.role WHERE name = 'Administrador' LIMIT 1),
  'Administrador',
  'Objetivo US32',
  true,
  'admin.objetivo.us32@rchq.test',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  false,
  false,
  0,
  0,
  NULL,
  'MOXC801103MBSCYF81',
  NULL,
  '1990-01-01',
  NULL,
  '2025-01-01',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'nomina'
)
ON CONFLICT (employee_id) DO UPDATE SET
  house_id = EXCLUDED.house_id,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  has_first_login = EXCLUDED.has_first_login,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  type = EXCLUDED.type;

-- DÃ­as laborales L-V para empleados US32
INSERT INTO public.employee_shift (shift_id, employee_id, start_workday_id, end_workday_id, start, "end", is_all_day)
SELECT
  wd.workday_id,
  emp.employee_id,
  '09:00:00'::time,
  '18:00:00'::time
FROM (
  VALUES
    ('c0000001-0000-4000-8000-000000000001'::uuid),
    ('c0000001-0000-4000-8000-000000000002'::uuid),
    ('c0000001-0000-4000-8000-000000000003'::uuid),
    ('c0000001-0000-4000-8000-000000000004'::uuid),
    ('c0000001-0000-4000-8000-000000000005'::uuid)
) AS wd(workday_id)
CROSS JOIN (
  VALUES
    ('e3200001-0000-4000-8000-000000000001'::uuid),
    ('e3200001-0000-4000-8000-000000000002'::uuid),
    ('e3200001-0000-4000-8000-000000000003'::uuid),
    ('e3200001-0000-4000-8000-000000000004'::uuid),
    ('e3200001-0000-4000-8000-000000000005'::uuid)
) AS emp(employee_id)
ON CONFLICT (workday_id, employee_id) DO UPDATE SET
  start = EXCLUDED.start,
  "end" = EXCLUDED."end";

-- Limpiar solo datos manuales US32 para que sea repetible
DELETE FROM public.logs
WHERE affected IN (
  'e3200001-0000-4000-8000-000000000003',
  'e3200001-0000-4000-8000-000000000004',
  'e3200001-0000-4000-8000-000000000005'
)
OR employee_id IN (
  'e3200001-0000-4000-8000-000000000001',
  'e3200001-0000-4000-8000-000000000002'
);

DELETE FROM public.vacations_request
WHERE vacations_request_id::text LIKE 'c3200000-0000-4000-8000-%';

-- Solicitudes para pruebas manuales US32
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
VALUES
-- Caso exitoso: pendiente de empleado misma casa
(
  'c3200000-0000-4000-8000-000000000001',
  'e3200001-0000-4000-8000-000000000003',
  '2026-10-05',
  '2026-10-06',
  0,
  NULL,
  NOW(),
  2
),
-- Caso exitoso: aprobada de empleado misma casa
(
  'c3200000-0000-4000-8000-000000000002',
  'e3200001-0000-4000-8000-000000000003',
  '2026-10-12',
  '2026-10-13',
  1,
  NULL,
  NOW(),
  2
),
-- Caso exitoso: rechazada de empleado misma casa
(
  'c3200000-0000-4000-8000-000000000003',
  'e3200001-0000-4000-8000-000000000003',
  '2026-10-19',
  '2026-10-20',
  2,
  'No procede',
  NOW(),
  2
),
-- Caso out of scope: empleado de otra casa
(
  'c3200000-0000-4000-8000-000000000004',
  'e3200001-0000-4000-8000-000000000004',
  '2026-10-26',
  '2026-10-27',
  0,
  NULL,
  NOW(),
  2
),
-- Caso concurrencia: dos DELETE al mismo recurso
(
  'c3200000-0000-4000-8000-000000000096',
  'e3200001-0000-4000-8000-000000000003',
  '2026-11-09',
  '2026-11-10',
  0,
  NULL,
  NOW(),
  2
)
ON CONFLICT (vacations_request_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  start = EXCLUDED.start,
  "end" = EXCLUDED."end",
  status = EXCLUDED.status,
  feedback = EXCLUDED.feedback,
  created_at = EXCLUDED.created_at,
  used_days = EXCLUDED.used_days;

COMMIT;

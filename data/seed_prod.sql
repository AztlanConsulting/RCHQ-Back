-- ============================================================
-- SEED Production — RCHQ
-- Re-run safe: todos los inserts tienen ON CONFLICT DO NOTHING
-- ============================================================

-- =========================
-- HOUSES
-- =========================
INSERT INTO public.house (house_id, name, location, phone_number, description, image)
VALUES 
('a0000001-0000-4000-8000-000000000001', 'Casa María Goretti I.A.P', 'Querétaro, Qro.', '4420000012', 'Atención especializada', 'default_house'),
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
('a0000001-0000-4000-8000-000000000012', 'Senderos I.A.P', 'Querétaro, Qro.', '4420000011', 'Camino a una vida digna', 'default_house')
ON CONFLICT DO NOTHING;

-- =========================
-- ROLES
-- =========================
INSERT INTO public.role (role_id, name)
VALUES 
('a0000002-0000-4000-8000-000000000001', 'Coordinador'),
('a0000002-0000-4000-8000-000000000002', 'Administrador'),
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

-- Administrador — todos los privilegios
INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT 'a0000002-0000-4000-8000-000000000002', privilege_id
FROM public.privileges
ON CONFLICT DO NOTHING;

-- Coordinador — gestión completa incluyendo logs
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
('blck-002', 'Empleado eliminado de la lista negra', true)
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
('c0000001-0000-4000-8000-000000000024', 'Constancia de Capacitación o Certificación')
ON CONFLICT DO NOTHING;


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

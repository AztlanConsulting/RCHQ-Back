-- Minimal seed: houses, roles, one employee, and log actions
-- Login: andre@gmail.com / Andatti67
-- Re-run safe


-- =========================
-- CATÁLOGOS
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
('a0000001-0000-4000-8000-000000000013', 'Casa María Goretti I.A.P', 'Querétaro, Qro.', '4420000012', 'Atención especializada', 'default_house');

INSERT INTO public.role (role_id, name)
VALUES 
('a0000002-0000-4000-8000-000000000001', 'Coordinador'),
('a0000002-0000-4000-8000-000000000002', 'Admin'), -- Utilizo Admin/Administrador consolidado
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
('a0000002-0000-4000-8000-000000000023', 'Cocinera');

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
  'b8f54b14-701e-4e87-a019-caef53dcda99', -- UUID fijo para que sea Re-run safe y testeable
  (SELECT house_id FROM house WHERE name = 'Desarrollo' LIMIT 1),
  (SELECT role_id FROM role WHERE name = 'Admin' LIMIT 1),
  'Carlos',
  'Ramírez',
  true,
  'andre@gmail.com',
  '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
  true, -- En true para evitar el modal de "cambio de contraseña" inicial
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
('empl-001', 'Empleado creado con éxito', false),
('empl-002', 'Documento de empleado subido', false),
('empl-003', 'Documento de empleado actualizado', false),
('empl-004', 'Documento de empleado eliminado', false);

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
('c0000001-0000-4000-8000-000000000024', 'Constancia de Capacitación o Certificación');

COMMIT;
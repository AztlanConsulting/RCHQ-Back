-- =========================
-- EXTENSION UUID
-- =========================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- CATÁLOGOS
-- =========================

INSERT INTO donationtype VALUES
(gen_random_uuid(), 'Alimentos'),
(gen_random_uuid(), 'Ropa');

INSERT INTO donator VALUES
(gen_random_uuid(), 'Juan Donador'),
(gen_random_uuid(), 'Empresa XYZ');

INSERT INTO workday VALUES
(gen_random_uuid(), 'Lunes'),
(gen_random_uuid(), 'Martes');

INSERT INTO role VALUES
(gen_random_uuid(), 'Admin'),
(gen_random_uuid(), 'Empleado');

INSERT INTO eventtype VALUES
(gen_random_uuid(), 'Reunión'),
(gen_random_uuid(), 'Capacitación');

INSERT INTO insidecertifications VALUES
(gen_random_uuid(), 'Primeros Auxilios', 'Curso básico');

-- =========================
-- HOUSE
-- =========================

INSERT INTO house VALUES
(gen_random_uuid(), 'Casa Hogar Qro', 'Querétaro', '4421234567', 'Casa principal', 'img.jpg');

-- =========================
-- EMPLOYEE
-- =========================

INSERT INTO employee (
  employeeid, houseid, roleid, "Name", surname,
  isactive, email, "Password", hasfirstlogin,
  totpsecret, curp, birthdate, picture,
  startdate, nss, bank_account
)
VALUES (
  gen_random_uuid(),
  (SELECT houseid FROM house LIMIT 1),
  (SELECT roleid FROM role LIMIT 1),
  'Carlos',
  'Ramírez',
  true,
  'carlos@test.com',
  'hashed_pass',
  true,
  NULL,
  'RAMC900101HDFXXX01',
  '1990-01-01',
  'foto.jpg',
  CURRENT_DATE,
  '12345678901',
  '123456789012345678'
);

-- =========================
-- DONATION
-- =========================

INSERT INTO donation VALUES (
  gen_random_uuid(),
  (SELECT donatorid FROM donator LIMIT 1),
  (SELECT donationtypeid FROM donationtype LIMIT 1),
  CURRENT_DATE,
  'Arroz',
  50,
  'kg'
);

-- =========================
-- FAULT
-- =========================

INSERT INTO fault VALUES (
  gen_random_uuid(),
  CURRENT_DATE,
  'Llegada tarde'
);

INSERT INTO employeefault VALUES (
  (SELECT faultid FROM fault LIMIT 1),
  (SELECT employeeid FROM employee LIMIT 1)
);

-- =========================
-- WORKDAY REL
-- =========================

INSERT INTO employeeworkday VALUES (
  (SELECT workdayid FROM workday LIMIT 1),
  (SELECT employeeid FROM employee LIMIT 1),
  '08:00',
  '17:00'
);

-- =========================
-- ADDRESS
-- =========================

INSERT INTO employeeaddress VALUES (
  gen_random_uuid(),
  (SELECT employeeid FROM employee LIMIT 1),
  'https://maps.google.com',
  NOW()
);

-- =========================
-- LOGS
-- =========================

INSERT INTO logs VALUES (
  gen_random_uuid(),
  (SELECT employeeid FROM employee LIMIT 1),
  NOW(),
  'Login exitoso',
  '127.0.0.1'
);

-- =========================
-- BACKUP CODES
-- =========================

INSERT INTO employeebackupcode VALUES (
  gen_random_uuid(),
  (SELECT employeeid FROM employee LIMIT 1),
  'ABC123'
);

-- =========================
-- DOCUMENTS
-- =========================

INSERT INTO documents (
  documentid, cv, birth_certificate
)
VALUES (
  gen_random_uuid(),
  'cv.pdf',
  'birth.pdf'
);

INSERT INTO employeedocuments VALUES (
  (SELECT documentid FROM documents LIMIT 1),
  (SELECT employeeid FROM employee LIMIT 1),
  'url_doc'
);

-- =========================
-- CERTIFICATIONS
-- =========================

INSERT INTO employeeinsidecertification VALUES (
  (SELECT insidecertificationid FROM insidecertifications LIMIT 1),
  (SELECT employeeid FROM employee LIMIT 1),
  CURRENT_DATE
);

-- =========================
-- EVENTS
-- =========================

INSERT INTO personalevent VALUES (
  gen_random_uuid(),
  (SELECT eventtypeid FROM eventtype LIMIT 1),
  NOW(),
  NOW() + interval '2 hours',
  'Evento personal',
  'Descripción'
);

INSERT INTO employeepersonalevent VALUES (
  (SELECT personaleventid FROM personalevent LIMIT 1),
  (SELECT employeeid FROM employee LIMIT 1)
);

-- =========================
-- GLOBAL EVENT
-- =========================

INSERT INTO globalevent VALUES (
  gen_random_uuid(),
  (SELECT eventtypeid FROM eventtype LIMIT 1),
  CURRENT_DATE,
  '09:00',
  '18:00',
  'Día especial',
  'Evento global',
  false
);

-- =========================
-- VACATIONS
-- =========================

INSERT INTO vacationsrequest VALUES (
  gen_random_uuid(),
  (SELECT employeeid FROM employee LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + interval '5 days',
  1,
  'Aprobado'
);
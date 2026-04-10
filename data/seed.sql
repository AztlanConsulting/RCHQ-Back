-- Minimal seed: one house, one role, one employee (FK order: house + role, then employee).
-- Login: dev@example.com / 123
-- Re-run safe: deletes seed rows by fixed IDs then inserts (dev only).

BEGIN;

DELETE FROM public.employee WHERE employeeid = 'a0000003-0000-4000-8000-000000000003';
DELETE FROM public.house WHERE houseid = 'a0000001-0000-4000-8000-000000000001';
DELETE FROM public.role WHERE roleid = 'a0000002-0000-4000-8000-000000000002';

INSERT INTO public.house (houseid, "Name", "Location", phonenumber, description, image)
VALUES (
  'a0000001-0000-4000-8000-000000000001',
  'Desarrollo',
  'Tec de Monterrey',
  '4424792232',
  'Casa de desarrollo',
  'boop'
);

INSERT INTO public.role (roleid, "Name")
VALUES ('a0000002-0000-4000-8000-000000000002', 'admin');

INSERT INTO public.employee (
  employeeid,
  houseid,
  roleid,
  "Name",
  surname,
  isactive,
  email,
  "Password",
  hasfirstlogin,
  totpsecret,
  curp,
  birthdate,
  picture,
  startdate
)
VALUES (
  'a0000003-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000001',
  'a0000002-0000-4000-8000-000000000002',
  'Andre',
  'Agle',
  true,
  'andre@gmail.com',
  'andatti',
  true,
  NULL,
  'XAXX010101HDFXXX01',
  '2003-10-04',
  'boop',
  '2026-04-09'
);

COMMIT;

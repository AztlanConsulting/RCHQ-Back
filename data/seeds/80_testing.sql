-- ============================================================
-- SCRIPT EXTRA FINAL — DATA MANUAL us80
-- Ejecutar después de:
-- 1) DROP SCHEMA / CREATE SCHEMA
-- 2) Schema
-- 3) Seed minimal
-- ============================================================

BEGIN;

-- ============================================================
-- LIMPIEZA us80
-- ============================================================

DELETE FROM public.logs
WHERE employee_id IN (
    'e3400000-0000-4000-8000-000000000001',
    'e3400000-0000-4000-8000-000000000002',
    'e3400000-0000-4000-8000-000000000003',
    'e3400000-0000-4000-8000-000000000004',
    'e3400000-0000-4000-8000-000000000007',
    'e3400000-0000-4000-8000-000000000096',
    'b8f54b14-701e-4e87-a019-caef53dcda99'
)
OR affected IN (
    'e3400000-0000-4000-8000-000000000001',
    'e3400000-0000-4000-8000-000000000002',
    'e3400000-0000-4000-8000-000000000003',
    'e3400000-0000-4000-8000-000000000004',
    'e3400000-0000-4000-8000-000000000007',
    'e3400000-0000-4000-8000-000000000096',
    'b8f54b14-701e-4e87-a019-caef53dcda99'
);

DELETE FROM public.vacations_request
WHERE vacations_request_id::text LIKE 'c3400000-0000-4000-8000-%'
OR employee_id IN (
    'e3400000-0000-4000-8000-000000000001',
    'e3400000-0000-4000-8000-000000000002',
    'e3400000-0000-4000-8000-000000000003',
    'e3400000-0000-4000-8000-000000000004',
    'e3400000-0000-4000-8000-000000000007',
    'e3400000-0000-4000-8000-000000000096'
);

DELETE FROM public.employee_workday
WHERE employee_id IN (
    'e3400000-0000-4000-8000-000000000001',
    'e3400000-0000-4000-8000-000000000002',
    'e3400000-0000-4000-8000-000000000003',
    'e3400000-0000-4000-8000-000000000004',
    'e3400000-0000-4000-8000-000000000007',
    'e3400000-0000-4000-8000-000000000096'
);

DELETE FROM public.employee
WHERE employee_id IN (
    'e3400000-0000-4000-8000-000000000001',
    'e3400000-0000-4000-8000-000000000002',
    'e3400000-0000-4000-8000-000000000003',
    'e3400000-0000-4000-8000-000000000004',
    'e3400000-0000-4000-8000-000000000007',
    'e3400000-0000-4000-8000-000000000096'
);

-- ============================================================
-- ASEGURAR QUE EL ADMIN DEL SEED PUEDA APROBAR
-- ============================================================

UPDATE public.employee
SET
    house_id = 'a0000001-0000-4000-8000-000000000001',
    role_id = 'a0000002-0000-4000-8000-000000000002',
    has_first_login = false,
    is_active = true,
    is_active_two_factor_auth = false,
    failed_login_attempts = 0,
    failed_two_factor_auth_attempts = 0,
    blocked_until = NULL,
    two_fa_blocked_until = NULL,
    start_date = '2025-04-09'
WHERE email = 'andre@gmail.com';

-- ============================================================
-- EMPLEADOS us80
-- Password para todos: Andatti67
-- ============================================================

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
VALUES
(
    'e3400000-0000-4000-8000-000000000001',
    'a0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000001',
    'Coordinador',
    'us80',
    true,
    'coordinador.us80@rchq.test',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'us800101HDF00001',
    NULL,
    '1990-01-01',
    NULL,
    '2025-04-09',
    NULL,
    '+52 442 000 0001',
    NULL,
    NULL,
    'nomina'
),
(
    'e3400000-0000-4000-8000-000000000002',
    'a0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000003',
    'Empleado',
    'Sin Permisos us80',
    true,
    'empleado.valido.us80@rchq.test',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'us800101HDF00002',
    NULL,
    '1991-01-01',
    NULL,
    '2025-04-09',
    NULL,
    '+52 442 000 0002',
    NULL,
    NULL,
    'nomina'
),
(
    'e3400000-0000-4000-8000-000000000003',
    'a0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000003',
    'Empleado',
    'Desarrolló us80',
    true,
    'empleado.desarrollo.us80@rchq.test',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'us800101HDF00003',
    NULL,
    '1992-01-01',
    NULL,
    '2025-04-09',
    NULL,
    '+52 442 000 0003',
    NULL,
    NULL,
    'nomina'
),
(
    'e3400000-0000-4000-8000-000000000004',
    'b0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000003',
    'Empleado',
    'Otra Casa us80',
    true,
    'empleado.cdmx.us80@rchq.test',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'us800101HDF00004',
    NULL,
    '1993-01-01',
    NULL,
    '2025-04-09',
    NULL,
    '+52 442 000 0004',
    NULL,
    NULL,
    'nomina'
),
(
    'e3400000-0000-4000-8000-000000000007',
    'a0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000003',
    'Empleado',
    'Sin Dias us80',
    true,
    'sin.dias.us80@rchq.test',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'us800101HDF00007',
    NULL,
    '1994-01-01',
    NULL,
    '2025-04-09',
    NULL,
    '+52 442 000 0007',
    NULL,
    NULL,
    'nomina'
),
(
    'e3400000-0000-4000-8000-000000000096',
    'a0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000003',
    'Empleado',
    'Concurrencia us80',
    true,
    'concurrencia.us80@rchq.test',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'us800101HDF00096',
    NULL,
    '1996-01-01',
    NULL,
    '2025-04-09',
    NULL,
    '+52 442 000 0096',
    NULL,
    NULL,
    'nomina'
);

-- ============================================================
-- DÍAS LABORALES
-- Todos excepto e340...0007, que es el caso sin días laborales
-- ============================================================

INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT
    w.workday_id,
    e.employee_id,
    '09:00:00',
    '18:00:00'
FROM public.workday w
CROSS JOIN (
    VALUES
        ('b8f54b14-701e-4e87-a019-caef53dcda99'::uuid),
        ('e3400000-0000-4000-8000-000000000001'::uuid),
        ('e3400000-0000-4000-8000-000000000002'::uuid),
        ('e3400000-0000-4000-8000-000000000003'::uuid),
        ('e3400000-0000-4000-8000-000000000004'::uuid),
        ('e3400000-0000-4000-8000-000000000096'::uuid)
) AS e(employee_id)
WHERE w.name IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes')
ON CONFLICT (workday_id, employee_id) DO UPDATE SET
    start = EXCLUDED.start,
    "end" = EXCLUDED."end";

-- ============================================================
-- SOLICITUDES us80
-- IDs alineados con us80-tests.sh
-- ============================================================

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
-- Caso 13: admin aprueba correctamente
(
    'c3400000-0000-4000-8000-000000000001',
    'e3400000-0000-4000-8000-000000000003',
    '2026-10-05',
    '2026-10-07',
    0,
    NULL,
    NOW(),
    3
),

-- Caso 9: solicitud pendiente que traslapa con una aprobada
(
    'c3400000-0000-4000-8000-000000000002',
    'e3400000-0000-4000-8000-000000000003',
    '2026-10-13',
    '2026-10-15',
    0,
    NULL,
    NOW(),
    3
),

-- Vacación aprobada auxiliar para provocar traslape del caso 9
(
    'c3400000-0000-4000-8000-000000000003',
    'e3400000-0000-4000-8000-000000000003',
    '2026-10-14',
    '2026-10-16',
    1,
    NULL,
    NOW(),
    3
),

-- Caso 6: solicitud ya aprobada
(
    'c3400000-0000-4000-8000-000000000004',
    'e3400000-0000-4000-8000-000000000003',
    '2026-10-19',
    '2026-10-20',
    1,
    NULL,
    NOW(),
    2
),

-- Caso 7: solicitud ya rechazada
(
    'c3400000-0000-4000-8000-000000000005',
    'e3400000-0000-4000-8000-000000000003',
    '2026-10-21',
    '2026-10-22',
    2,
    'Rechazada de prueba',
    NOW(),
    2
),

-- Caso 8: solicitud de empleado fuera de la casa del coordinador
(
    'c3400000-0000-4000-8000-000000000006',
    'e3400000-0000-4000-8000-000000000004',
    '2026-10-05',
    '2026-10-07',
    0,
    NULL,
    NOW(),
    3
),

-- Caso 12: empleado sin días laborales
(
    'c3400000-0000-4000-8000-000000000007',
    'e3400000-0000-4000-8000-000000000007',
    '2026-10-05',
    '2026-10-07',
    0,
    NULL,
    NOW(),
    3
),

-- Auxiliar para consumir días activos del caso 10
(
    'c3400000-0000-4000-8000-000000000008',
    'e3400000-0000-4000-8000-000000000003',
    '2026-11-02',
    '2026-11-13',
    0,
    NULL,
    NOW(),
    10
),

-- Caso 10: días insuficientes
(
    'c3400000-0000-4000-8000-000000000009',
    'e3400000-0000-4000-8000-000000000003',
    '2026-11-16',
    '2026-11-20',
    0,
    NULL,
    NOW(),
    5
),

-- Caso 11: fuera del año laboral actual
(
    'c3400000-0000-4000-8000-000000000010',
    'e3400000-0000-4000-8000-000000000003',
    '2028-01-10',
    '2028-01-12',
    0,
    NULL,
    NOW(),
    3
),

-- Caso 14: coordinador aprueba solicitud de su misma casa
(
    'c3400000-0000-4000-8000-000000000011',
    'e3400000-0000-4000-8000-000000000003',
    '2026-12-01',
    '2026-12-03',
    0,
    NULL,
    NOW(),
    3
),

-- Caso 15: concurrencia
(
    'c3400000-0000-4000-8000-000000000096',
    'e3400000-0000-4000-8000-000000000096',
    '2026-10-05',
    '2026-10-07',
    0,
    NULL,
    NOW(),
    3
);

BEGIN;

-- ============================================================
-- FIX FINAL us80 — empleados separados para casos exitosos
-- ============================================================

-- Limpiar si ya existían
DELETE FROM public.logs
WHERE employee_id IN (
    'e3400000-0000-4000-8000-000000000013',
    'e3400000-0000-4000-8000-000000000014'
)
OR affected IN (
    'e3400000-0000-4000-8000-000000000013',
    'e3400000-0000-4000-8000-000000000014'
);

DELETE FROM public.vacations_request
WHERE employee_id IN (
    'e3400000-0000-4000-8000-000000000013',
    'e3400000-0000-4000-8000-000000000014'
);

DELETE FROM public.employee_workday
WHERE employee_id IN (
    'e3400000-0000-4000-8000-000000000013',
    'e3400000-0000-4000-8000-000000000014'
);

DELETE FROM public.employee
WHERE employee_id IN (
    'e3400000-0000-4000-8000-000000000013',
    'e3400000-0000-4000-8000-000000000014'
);

-- Empleados limpios para casos exitosos
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
VALUES
(
    'e3400000-0000-4000-8000-000000000013',
    'a0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000003',
    'Empleado',
    'Éxito Admin us80',
    true,
    'exito.admin.us80@rchq.test',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'us800101HDF00013',
    NULL,
    '1993-01-01',
    NULL,
    '2025-04-09',
    NULL,
    '+52 442 000 0013',
    NULL,
    NULL,
    'nomina'
),
(
    'e3400000-0000-4000-8000-000000000014',
    'a0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000003',
    'Empleado',
    'Exito Coord us80',
    true,
    'exito.coord.us80@rchq.test',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'us800101HDF00014',
    NULL,
    '1994-01-01',
    NULL,
    '2025-04-09',
    NULL,
    '+52 442 000 0014',
    NULL,
    NULL,
    'nomina'
);

-- Días laborales para esos empleados
INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT
    w.workday_id,
    e.employee_id,
    '09:00:00',
    '18:00:00'
FROM public.workday w
CROSS JOIN (
    VALUES
        ('e3400000-0000-4000-8000-000000000013'::uuid),
        ('e3400000-0000-4000-8000-000000000014'::uuid)
) AS e(employee_id)
WHERE w.name IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes')
ON CONFLICT (workday_id, employee_id) DO UPDATE SET
    start = EXCLUDED.start,
    "end" = EXCLUDED."end";

UPDATE public.vacations_request
SET
    employee_id = 'e3400000-0000-4000-8000-000000000013',
    status = 0,
    feedback = NULL
WHERE vacations_request_id = 'c3400000-0000-4000-8000-000000000001';

UPDATE public.vacations_request
SET
    employee_id = 'e3400000-0000-4000-8000-000000000014',
    status = 0,
    feedback = NULL
WHERE vacations_request_id = 'c3400000-0000-4000-8000-000000000011';

COMMIT;
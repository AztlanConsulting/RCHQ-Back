-- ============================================================
-- Coordinador en otra casa (Sonríe villa infantil)
-- Ejecutar después del schema y seed.sql
-- Re-run safe: ON CONFLICT actualiza datos clave
--
-- Login: coordinador.sonrie@rchq.test
-- Password: Andatti67
-- Casa: Sonríe villa infantil (distinta a Casa María Goretti I.A.P)
-- ============================================================

BEGIN;

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
    blocked_until,
    temp_totp_secret,
    temp_totp_secret_created_at,
    type
)
VALUES (
    'e0000002-0000-4000-8000-000000000001',
    (SELECT house_id FROM public.house WHERE name = 'Sonríe villa infantil' LIMIT 1),
    (SELECT role_id FROM public.role WHERE name = 'Coordinador' LIMIT 1),
    'Patricia',
    'Hernández',
    true,
    'coordinador.sonrie@rchq.test',
    '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS',
    false,
    false,
    0,
    0,
    NULL,
    'HEHP900215MDFRRR02',
    NULL,
    '1990-02-15',
    NULL,
    CURRENT_DATE,
    NULL,
    '4420001002',
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
    name = EXCLUDED.name,
    surname = EXCLUDED.surname,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    has_first_login = EXCLUDED.has_first_login,
    is_active = EXCLUDED.is_active,
    is_active_two_factor_auth = EXCLUDED.is_active_two_factor_auth,
    failed_login_attempts = EXCLUDED.failed_login_attempts,
    failed_two_factor_auth_attempts = EXCLUDED.failed_two_factor_auth_attempts,
    blocked_until = EXCLUDED.blocked_until,
    curp = EXCLUDED.curp,
    birth_date = EXCLUDED.birth_date,
    start_date = EXCLUDED.start_date,
    phone_number = EXCLUDED.phone_number,
    type = EXCLUDED.type;

-- Horario L–V (mismo patrón que otros coordinadores del seed)
INSERT INTO public.employee_workday (workday_id, employee_id, start, "end")
SELECT
    wd.workday_id,
    'e0000002-0000-4000-8000-000000000001'::uuid,
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
ON CONFLICT (workday_id, employee_id) DO UPDATE SET
    start = EXCLUDED.start,
    "end" = EXCLUDED."end";

COMMIT;

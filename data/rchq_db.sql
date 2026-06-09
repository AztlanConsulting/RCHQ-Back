-- =============================================================
-- FULL DATABASE SETUP
-- Schema + Migrations + Seed
-- Re-run safe (usa IF NOT EXISTS y ON CONFLICT DO NOTHING)
-- =============================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- =============================================================
-- 1. TABLAS BASE (sin dependencias)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.donation_type (
    donation_type_id uuid NOT NULL,
    name varchar(30) NOT NULL UNIQUE,
    CONSTRAINT donation_type_pk PRIMARY KEY (donation_type_id)
);

CREATE TABLE IF NOT EXISTS public.donator (
    donator_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    CONSTRAINT donator_pk PRIMARY KEY (donator_id)
);

CREATE TABLE IF NOT EXISTS public.fault (
    fault_id uuid NOT NULL,
    date date NOT NULL,
    description text NOT NULL,
    CONSTRAINT fault_pk PRIMARY KEY (fault_id)
);

CREATE TABLE IF NOT EXISTS public.workday (
    workday_id uuid NOT NULL,
    name varchar(9) NOT NULL UNIQUE,
    CONSTRAINT workday_pk PRIMARY KEY (workday_id)
);

CREATE TABLE IF NOT EXISTS public.house (
    house_id uuid NOT NULL,
    name varchar(60) NOT NULL UNIQUE,
    location text NOT NULL,
    phone_number varchar(15) NOT NULL,
    description text NOT NULL,
    image varchar(100) NOT NULL,
    CONSTRAINT house_pk PRIMARY KEY (house_id)
);

CREATE TABLE IF NOT EXISTS public.role (
    role_id uuid NOT NULL,
    name varchar(50) NOT NULL UNIQUE,
    CONSTRAINT role_pk PRIMARY KEY (role_id)
);

CREATE TABLE IF NOT EXISTS public.privileges (
  privilege_id  uuid        NOT NULL,
  name          varchar(50) NOT NULL UNIQUE,
  CONSTRAINT privileges_pk PRIMARY KEY (privilege_id)
);

CREATE TABLE IF NOT EXISTS public.role_privilege (
  role_id       uuid NOT NULL,
  privilege_id  uuid NOT NULL,
  CONSTRAINT role_privilege_pk PRIMARY KEY (role_id, privilege_id),
  CONSTRAINT role_privilege_role_fk      FOREIGN KEY (role_id)      REFERENCES public.role(role_id)      ON DELETE CASCADE,
  CONSTRAINT role_privilege_privilege_fk FOREIGN KEY (privilege_id) REFERENCES public.privileges(privilege_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.event_type (
	event_type_id uuid NOT NULL,
	name varchar(30) NOT NULL UNIQUE,
	CONSTRAINT event_type_pk PRIMARY KEY (event_type_id)
);

CREATE TABLE IF NOT EXISTS public.inside_certifications (
    inside_certification_id uuid NOT NULL,
    name varchar(70) NOT NULL UNIQUE,
    description text NOT NULL,
    CONSTRAINT inside_certifications_pk PRIMARY KEY (inside_certification_id)
);

CREATE TABLE IF NOT EXISTS public.documents (
    document_id uuid NOT NULL,
    name varchar(100) NOT NULL UNIQUE,
    CONSTRAINT documents_pk PRIMARY KEY (document_id)
);

CREATE TABLE IF NOT EXISTS public.action (
    action_id char(8) NOT NULL,
    description varchar(120) NOT NULL,
    important bool NOT NULL,
    CONSTRAINT action_pk PRIMARY KEY (action_id)
);

CREATE TABLE IF NOT EXISTS public.frecuency_of_payment (
    frecuency_of_payment_id uuid NOT NULL,
    name varchar(20) NOT NULL UNIQUE,
    CONSTRAINT frecuency_of_payment_pk PRIMARY KEY (frecuency_of_payment_id)
);

-- =============================================================
-- 2. EMPLOYEE (depende de house y role)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.employee (
    employee_id                      uuid          NOT NULL,
    house_id                         uuid          NOT NULL,
    role_id                          uuid          NOT NULL,
    name                             varchar(50)   NOT NULL,
    surname                          varchar(50)   NOT NULL,
    is_active                        bool          NOT NULL,
    email                            varchar(60)   NOT NULL UNIQUE,
    password                         varchar(72)   NOT NULL,
    has_first_login                  bool          NOT NULL,
    is_active_two_factor_auth        bool          NOT NULL DEFAULT false,
    failed_login_attempts            int           NOT NULL DEFAULT 0,
    failed_two_factor_auth_attempts  int           NOT NULL DEFAULT 0,
    totp_secret                      varchar(32)   NULL,
    curp                             varchar(18)   NOT NULL,
    rfc                              varchar(13)   NULL UNIQUE,
    birth_date                       date          NULL,
    picture                          varchar(150)  NULL,
    start_date                       date          NOT NULL,
    end_date                         date          NULL,
    deactivation_reason              varchar(250)  NULL,
    out_of_blacklist_reason          varchar(250)  NULL,
    nss                              varchar(11)   NULL UNIQUE,
    bank_account                     varchar(18)   NULL,
    phone_number                     varchar(20)   NULL,
    type                             varchar(20)   NOT NULL DEFAULT 'nomina',
    salary                           varchar(72)   NULL,
    frequency_of_payment_id            uuid          NULL,
    blocked_until                    timestamp     NULL,
    two_fa_blocked_until             timestamp     NULL,
    temp_totp_secret                 varchar       NULL,
    temp_totp_secret_created_at      timestamp     NULL,
    refresh_token                    varchar       NULL,
    CONSTRAINT employee_pk                  PRIMARY KEY (employee_id),
    CONSTRAINT employee_curp_house_unique   UNIQUE (curp, house_id),
    CONSTRAINT employee_house_fk            FOREIGN KEY (house_id) REFERENCES public.house(house_id),
    CONSTRAINT employee_role_fk  FOREIGN KEY (role_id)  REFERENCES public.role(role_id),
    CONSTRAINT employee_frecuency_of_payment_fk FOREIGN KEY (frequency_of_payment_id) REFERENCES public.frecuency_of_payment(frecuency_of_payment_id)
);


-- =============================================================
-- 4. TABLAS QUE DEPENDEN DE EMPLOYEE
-- =============================================================

CREATE TABLE IF NOT EXISTS public.donation (
    donation_id uuid NOT NULL,
    donator_id uuid NOT NULL,
    donation_type_id uuid NOT NULL,
    date date NOT NULL,
    product varchar(30) NOT NULL,
    quantity decimal NOT NULL,
    measurement varchar(10) NOT NULL,
    CONSTRAINT donation_pk PRIMARY KEY (donation_id),
    CONSTRAINT donation_donator_fk FOREIGN KEY (donator_id) REFERENCES public.donator(donator_id),
    CONSTRAINT donation_donation_type_fk FOREIGN KEY (donation_type_id) REFERENCES public.donation_type(donation_type_id)
);

CREATE TABLE IF NOT EXISTS public.psychological_evaluation (
    psychological_evaluation_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    file varchar(100) NOT NULL,
    date date NOT NULL,
    CONSTRAINT psychological_evaluation_pk PRIMARY KEY (psychological_evaluation_id),
    CONSTRAINT psychological_evaluation_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE IF NOT EXISTS public.outside_certification (
    outside_certification_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    file varchar(100) NOT NULL,
    name varchar(70) NOT NULL,
    CONSTRAINT outside_certification_pk PRIMARY KEY (outside_certification_id),
    CONSTRAINT outside_certification_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE IF NOT EXISTS public.employee_address (
    employee_address_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    url text NOT NULL,
    street varchar(200) NULL,
    municipio varchar(120) NULL,
    city varchar(100) NULL,
    postal_code varchar(10) NULL,
    date timestamp NOT NULL,
    CONSTRAINT employee_address_pk PRIMARY KEY (employee_address_id),
    CONSTRAINT employee_address_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

-- Migración sobre employee_address si ya existía con url VARCHAR(100)
ALTER TABLE public.employee_address ALTER COLUMN url TYPE text;
ALTER TABLE public.employee_address ADD COLUMN IF NOT EXISTS street varchar(200);
ALTER TABLE public.employee_address ADD COLUMN IF NOT EXISTS municipio varchar(120);
ALTER TABLE public.employee_address ADD COLUMN IF NOT EXISTS city varchar(100);
ALTER TABLE public.employee_address ADD COLUMN IF NOT EXISTS postal_code varchar(10);

CREATE TABLE IF NOT EXISTS public.vacations_request (
    vacations_request_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    start date NOT NULL,
    "end" date NOT NULL,
    status int NOT NULL,
    feedback text NULL,
    created_at timestamp NOT NULL,
	used_days int NOT NULL,
    CONSTRAINT vacations_request_pk PRIMARY KEY (vacations_request_id),
    CONSTRAINT vacations_request_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE IF NOT EXISTS public.logs (
    log_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    moment timestamp NOT NULL,
    action_id varchar(8) NOT NULL,
    affected varchar(120) NULL,
    ip_address varchar(72) NOT NULL,
    CONSTRAINT logs_pk PRIMARY KEY (log_id),
    CONSTRAINT logs_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id),
    CONSTRAINT logs_action_fk FOREIGN KEY (action_id) REFERENCES public.action(action_id)
);

CREATE TABLE IF NOT EXISTS public.employee_backup_code (
    backup_code_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    code varchar(10) NOT NULL UNIQUE,
    CONSTRAINT employee_backup_code_pk PRIMARY KEY (backup_code_id),
    CONSTRAINT employee_backup_code_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE IF NOT EXISTS public.employee_fault (
    fault_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    CONSTRAINT employee_fault_pk PRIMARY KEY (fault_id, employee_id),
    CONSTRAINT employee_fault_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id),
    CONSTRAINT employee_fault_fault_fk FOREIGN KEY (fault_id) REFERENCES public.fault(fault_id)
);

CREATE TABLE IF NOT EXISTS public.employee_workday (
    workday_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    start time NOT NULL,
    "end" time NOT NULL,
    CONSTRAINT employee_workday_pk PRIMARY KEY (workday_id, employee_id),
    CONSTRAINT employee_workday_workday_fk FOREIGN KEY (workday_id) REFERENCES public.workday(workday_id),
    CONSTRAINT employee_workday_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE IF NOT EXISTS public.employee_inside_certification (
    inside_certification_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    date date NOT NULL,
    CONSTRAINT employee_inside_certification_pk PRIMARY KEY (inside_certification_id, employee_id),
    CONSTRAINT employee_inside_certification_inside_certifications_fk FOREIGN KEY (inside_certification_id) REFERENCES public.inside_certifications(inside_certification_id),
    CONSTRAINT employee_inside_certification_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE IF NOT EXISTS public.employee_documents (
    document_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    url text NOT NULL,
    CONSTRAINT employee_documents_pk PRIMARY KEY (document_id, employee_id),
    CONSTRAINT employee_documents_documents_fk FOREIGN KEY (document_id) REFERENCES public.documents(document_id),
    CONSTRAINT employee_documents_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE IF NOT EXISTS public.house_donation (
    house_donation_id uuid NOT NULL,
    house_id uuid NOT NULL,
    donation_id uuid NOT NULL,
    quantity decimal NOT NULL,
    date date NOT NULL,
    CONSTRAINT house_donation_pk PRIMARY KEY (house_donation_id),
    CONSTRAINT house_donation_house_fk FOREIGN KEY (house_id) REFERENCES public.house(house_id),
    CONSTRAINT house_donation_donation_fk FOREIGN KEY (donation_id) REFERENCES public.donation(donation_id)
);

CREATE TABLE IF NOT EXISTS public.personal_event (
    personal_event_id uuid NOT NULL,
    event_type_id uuid NOT NULL,
    date date NOT NULL,
    start timestamp NOT NULL,
    "end" timestamp NOT NULL,
    name varchar(70) NOT NULL,
    description varchar(250) NULL,
    all_day boolean NOT NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    trainer varchar(150) NULL,
    CONSTRAINT personal_event_pk PRIMARY KEY (personal_event_id),
    CONSTRAINT personal_event_event_type_fk FOREIGN KEY (event_type_id) REFERENCES public.event_type(event_type_id)
);

CREATE TABLE IF NOT EXISTS public.house_event (
    house_event_id uuid NOT NULL,
    event_type_id uuid NOT NULL,
    house_id uuid NOT NULL,
    start timestamp NOT NULL,
    "end" timestamp NOT NULL,
    name varchar(70) NOT NULL,
    description varchar(250) NULL,
    all_day boolean NOT NULL,
    is_free_day boolean NOT NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    CONSTRAINT house_event_pk PRIMARY KEY (house_event_id),
    CONSTRAINT house_event_event_type_fk FOREIGN KEY (event_type_id) REFERENCES public.event_type(event_type_id),
    CONSTRAINT house_event_house_fk FOREIGN KEY (house_id) REFERENCES public.house(house_id)
);

CREATE TABLE IF NOT EXISTS public.global_event (
    global_event_id uuid NOT NULL,
    event_type_id uuid NOT NULL,
    start timestamp NOT NULL,
    "end" timestamp NOT NULL,
    name varchar(70) NOT NULL,
    description varchar(250) NULL,
    all_day boolean NOT NULL,
    is_free_day boolean NOT NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    CONSTRAINT global_event_pk PRIMARY KEY (global_event_id),
    CONSTRAINT global_event_event_type_fk FOREIGN KEY (event_type_id) REFERENCES public.event_type(event_type_id)
);

CREATE TABLE IF NOT EXISTS public.employee_personal_event (
    personal_event_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    CONSTRAINT employee_personal_event_pk PRIMARY KEY (personal_event_id, employee_id),
    CONSTRAINT employee_personal_event_personal_event_fk FOREIGN KEY (personal_event_id) REFERENCES public.personal_event(personal_event_id),
    CONSTRAINT employee_personal_event_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE IF NOT EXISTS public.absence_type (
	absence_type_id uuid NOT NULL,
	name varchar(30) NOT NULL UNIQUE,
	CONSTRAINT absence_type_pk PRIMARY KEY (absence_type_id)
);

CREATE TABLE IF NOT EXISTS public.absence (
    absence_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    absence_type_id uuid NOT NULL,
    start date NOT NULL,
    "end" date NOT NULL,
    description text NULL,
    url text NULL,
    is_deleted bool NOT NULL DEFAULT false,
    CONSTRAINT absence_pk PRIMARY KEY (absence_id),
    CONSTRAINT absence_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id),
    CONSTRAINT absence_absence_type_fk FOREIGN KEY (absence_type_id) REFERENCES public.absence_type(absence_type_id)

);

CREATE TABLE IF NOT EXISTS public.blacklist (
    blacklist_id uuid        NOT NULL DEFAULT gen_random_uuid(),
    curp         varchar(18) NOT NULL UNIQUE,
    reason       varchar(250) NOT NULL,
    created_at   timestamp   NOT NULL DEFAULT now(),
    CONSTRAINT blacklist_pk PRIMARY KEY (blacklist_id)
);
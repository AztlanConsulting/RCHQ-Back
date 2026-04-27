-- Rename concatenated-lowercase columns → snake_case to match data/rchq_db.sql and Prisma.
-- One RENAME per statement (some SQL editors reject comma-chained RENAME COLUMN).
-- If a line errors (column already renamed), comment it out and continue.
-- employee.employee_id: skip if you already ran migrate_employee_id_column.sql

BEGIN;

-- Catalog / leaf tables
ALTER TABLE public.donation_type RENAME COLUMN donationtypeid TO donation_type_id;
ALTER TABLE public.donator RENAME COLUMN donatorid TO donator_id;
ALTER TABLE public.fault RENAME COLUMN faultid TO fault_id;
ALTER TABLE public.workday RENAME COLUMN workdayid TO workday_id;

ALTER TABLE public.house RENAME COLUMN houseid TO house_id;
ALTER TABLE public.house RENAME COLUMN phonenumber TO phone_number;

ALTER TABLE public.role RENAME COLUMN roleid TO role_id;
ALTER TABLE public.event_type RENAME COLUMN eventtypeid TO event_type_id;
ALTER TABLE public.inside_certifications RENAME COLUMN insidecertificationid TO inside_certification_id;

ALTER TABLE public.documents RENAME COLUMN documentid TO document_id;
ALTER TABLE public.documents RENAME COLUMN birthcertificate TO birth_certificate;
ALTER TABLE public.documents RENAME COLUMN taxstatuscertificate TO tax_status_certificate;
ALTER TABLE public.documents RENAME COLUMN addresscertificate TO address_certificate;
ALTER TABLE public.documents RENAME COLUMN professionalid TO professional_id;
ALTER TABLE public.documents RENAME COLUMN educationcertificate TO education_certificate;
ALTER TABLE public.documents RENAME COLUMN medicalcertificate TO medical_certificate;
ALTER TABLE public.documents RENAME COLUMN statecriminalrecordcertificate TO state_criminal_record_certificate;
ALTER TABLE public.documents RENAME COLUMN federalcriminalrecordcertificate TO federal_criminal_record_certificate;
ALTER TABLE public.documents RENAME COLUMN firstrecommendationletter TO first_recommendation_letter;
ALTER TABLE public.documents RENAME COLUMN secondrecommendationletter TO second_recommendation_letter;
ALTER TABLE public.documents RENAME COLUMN driverlicense TO driver_license;
ALTER TABLE public.documents RENAME COLUMN signedregulation TO signed_regulation;
ALTER TABLE public.documents RENAME COLUMN signedcontract TO signed_contract;
ALTER TABLE public.documents RENAME COLUMN signedconfidentialletter TO signed_confidential_letter;
ALTER TABLE public.documents RENAME COLUMN signedethicsletter TO signed_ethics_letter;
ALTER TABLE public.documents RENAME COLUMN inductionmanual TO induction_manual;

ALTER TABLE public.action RENAME COLUMN actionid TO action_id;

-- employee (employee_id assumed already migrated)
ALTER TABLE public.employee RENAME COLUMN houseid TO house_id;
ALTER TABLE public.employee RENAME COLUMN roleid TO role_id;
ALTER TABLE public.employee RENAME COLUMN isactive TO is_active;
ALTER TABLE public.employee RENAME COLUMN hasfirstlogin TO has_first_login;
ALTER TABLE public.employee RENAME COLUMN isactive2fa TO is_active_2fa;
ALTER TABLE public.employee RENAME COLUMN failedloginattempts TO failed_login_attempts;
ALTER TABLE public.employee RENAME COLUMN failed2faattempts TO failed_2fa_attempts;
ALTER TABLE public.employee RENAME COLUMN totpsecret TO totp_secret;
ALTER TABLE public.employee RENAME COLUMN birthdate TO birth_date;
ALTER TABLE public.employee RENAME COLUMN startdate TO start_date;
ALTER TABLE public.employee RENAME COLUMN bankaccount TO bank_account;
ALTER TABLE public.employee RENAME COLUMN blockeduntil TO blocked_until;
ALTER TABLE public.employee RENAME COLUMN twofablockeduntil TO two_fa_blocked_until;
ALTER TABLE public.employee RENAME COLUMN temptotpsecret TO temp_totp_secret;
ALTER TABLE public.employee RENAME COLUMN temptotpsecretcreatedat TO temp_totp_secret_created_at;

ALTER TABLE public.donation RENAME COLUMN donationid TO donation_id;
ALTER TABLE public.donation RENAME COLUMN donatorid TO donator_id;
ALTER TABLE public.donation RENAME COLUMN donationtypeid TO donation_type_id;

ALTER TABLE public.psychological_evaluation RENAME COLUMN psychologicalevaluationid TO psychological_evaluation_id;
ALTER TABLE public.psychological_evaluation RENAME COLUMN employeeid TO employee_id;

ALTER TABLE public.outside_certification RENAME COLUMN outsidecertificationid TO outside_certification_id;
ALTER TABLE public.outside_certification RENAME COLUMN employeeid TO employee_id;

ALTER TABLE public.employee_address RENAME COLUMN employeeaddressid TO employee_address_id;
ALTER TABLE public.employee_address RENAME COLUMN employeeid TO employee_id;

ALTER TABLE public.vacations_request RENAME COLUMN vacationsrequestid TO vacations_request_id;
ALTER TABLE public.vacations_request RENAME COLUMN employeeid TO employee_id;

ALTER TABLE public.logs RENAME COLUMN logid TO log_id;
ALTER TABLE public.logs RENAME COLUMN employeeid TO employee_id;
ALTER TABLE public.logs RENAME COLUMN actionid TO action_id;
ALTER TABLE public.logs RENAME COLUMN ipaddress TO ip_address;

ALTER TABLE public.employee_backup_code RENAME COLUMN backupcodeid TO backup_code_id;
ALTER TABLE public.employee_backup_code RENAME COLUMN employeeid TO employee_id;

ALTER TABLE public.employee_fault RENAME COLUMN faultid TO fault_id;
ALTER TABLE public.employee_fault RENAME COLUMN employeeid TO employee_id;

ALTER TABLE public.employee_workday RENAME COLUMN workdayid TO workday_id;
ALTER TABLE public.employee_workday RENAME COLUMN employeeid TO employee_id;

ALTER TABLE public.employee_inside_certification RENAME COLUMN insidecertificationid TO inside_certification_id;
ALTER TABLE public.employee_inside_certification RENAME COLUMN employeeid TO employee_id;

ALTER TABLE public.employee_documents RENAME COLUMN documentid TO document_id;
ALTER TABLE public.employee_documents RENAME COLUMN employeeid TO employee_id;

ALTER TABLE public.house_donation RENAME COLUMN housedonationid TO house_donation_id;
ALTER TABLE public.house_donation RENAME COLUMN houseid TO house_id;
ALTER TABLE public.house_donation RENAME COLUMN donationid TO donation_id;

ALTER TABLE public.personal_event RENAME COLUMN personaleventid TO personal_event_id;
ALTER TABLE public.personal_event RENAME COLUMN eventtypeid TO event_type_id;

ALTER TABLE public.house_event RENAME COLUMN houseeventid TO house_event_id;
ALTER TABLE public.house_event RENAME COLUMN eventtypeid TO event_type_id;
ALTER TABLE public.house_event RENAME COLUMN houseid TO house_id;

ALTER TABLE public.global_event RENAME COLUMN globaleventid TO global_event_id;
ALTER TABLE public.global_event RENAME COLUMN eventtypeid TO event_type_id;
ALTER TABLE public.global_event RENAME COLUMN isfreeday TO is_free_day;

ALTER TABLE public.employee_personal_event RENAME COLUMN personaleventid TO personal_event_id;
ALTER TABLE public.employee_personal_event RENAME COLUMN employeeid TO employee_id;

COMMIT;

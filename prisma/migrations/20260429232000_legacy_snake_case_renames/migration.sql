-- Mirrors legacy SQL in rhcq_back/data/migrations (idempotent).
-- Safely renames camelCase/lowercase columns to snake_case if they still exist.

DO $$
BEGIN
  -- employee: employeeid -> employee_id
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employee'
      AND column_name = 'employeeid'
  ) THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN employeeid TO employee_id';
  END IF;

  -- employee foreign keys / auth fields
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='houseid') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN houseid TO house_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='roleid') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN roleid TO role_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='isactive') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN isactive TO is_active';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='hasfirstlogin') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN hasfirstlogin TO has_first_login';
  END IF;
  -- Legacy 2FA columns: normalize to Prisma's canonical column names
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='isactive2fa')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='is_active_two_factor_auth') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN isactive2fa TO is_active_two_factor_auth';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='failedloginattempts') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN failedloginattempts TO failed_login_attempts';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='failed2faattempts')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='failed_two_factor_auth_attempts') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN failed2faattempts TO failed_two_factor_auth_attempts';
  END IF;

  -- If the DB already has snake_case legacy names, normalize those too
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='is_active_2fa')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='is_active_two_factor_auth') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN is_active_2fa TO is_active_two_factor_auth';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='failed_2fa_attempts')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='failed_two_factor_auth_attempts') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN failed_2fa_attempts TO failed_two_factor_auth_attempts';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='totpsecret') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN totpsecret TO totp_secret';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='birthdate') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN birthdate TO birth_date';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='startdate') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN startdate TO start_date';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='bankaccount') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN bankaccount TO bank_account';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='blockeduntil') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN blockeduntil TO blocked_until';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='twofablockeduntil') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN twofablockeduntil TO two_fa_blocked_until';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='temptotpsecret') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN temptotpsecret TO temp_totp_secret';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee' AND column_name='temptotpsecretcreatedat') THEN
    EXECUTE 'ALTER TABLE public.employee RENAME COLUMN temptotpsecretcreatedat TO temp_totp_secret_created_at';
  END IF;

  -- donation_type, donator, fault, workday
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='donation_type' AND column_name='donationtypeid') THEN
    EXECUTE 'ALTER TABLE public.donation_type RENAME COLUMN donationtypeid TO donation_type_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='donator' AND column_name='donatorid') THEN
    EXECUTE 'ALTER TABLE public.donator RENAME COLUMN donatorid TO donator_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fault' AND column_name='faultid') THEN
    EXECUTE 'ALTER TABLE public.fault RENAME COLUMN faultid TO fault_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='workday' AND column_name='workdayid') THEN
    EXECUTE 'ALTER TABLE public.workday RENAME COLUMN workdayid TO workday_id';
  END IF;

  -- house
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='house' AND column_name='houseid') THEN
    EXECUTE 'ALTER TABLE public.house RENAME COLUMN houseid TO house_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='house' AND column_name='phonenumber') THEN
    EXECUTE 'ALTER TABLE public.house RENAME COLUMN phonenumber TO phone_number';
  END IF;

  -- role / event_type / inside_certifications
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='role' AND column_name='roleid') THEN
    EXECUTE 'ALTER TABLE public.role RENAME COLUMN roleid TO role_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_type' AND column_name='eventtypeid') THEN
    EXECUTE 'ALTER TABLE public.event_type RENAME COLUMN eventtypeid TO event_type_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inside_certifications' AND column_name='insidecertificationid') THEN
    EXECUTE 'ALTER TABLE public.inside_certifications RENAME COLUMN insidecertificationid TO inside_certification_id';
  END IF;

  -- documents
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='documentid') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN documentid TO document_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='birthcertificate') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN birthcertificate TO birth_certificate';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='taxstatuscertificate') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN taxstatuscertificate TO tax_status_certificate';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='addresscertificate') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN addresscertificate TO address_certificate';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='professionalid') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN professionalid TO professional_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='educationcertificate') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN educationcertificate TO education_certificate';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='medicalcertificate') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN medicalcertificate TO medical_certificate';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='statecriminalrecordcertificate') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN statecriminalrecordcertificate TO state_criminal_record_certificate';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='federalcriminalrecordcertificate') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN federalcriminalrecordcertificate TO federal_criminal_record_certificate';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='firstrecommendationletter') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN firstrecommendationletter TO first_recommendation_letter';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='secondrecommendationletter') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN secondrecommendationletter TO second_recommendation_letter';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='driverlicense') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN driverlicense TO driver_license';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='signedregulation') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN signedregulation TO signed_regulation';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='signedcontract') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN signedcontract TO signed_contract';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='signedconfidentialletter') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN signedconfidentialletter TO signed_confidential_letter';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='signedethicsletter') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN signedethicsletter TO signed_ethics_letter';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='inductionmanual') THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN inductionmanual TO induction_manual';
  END IF;

  -- action
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='action' AND column_name='actionid') THEN
    EXECUTE 'ALTER TABLE public.action RENAME COLUMN actionid TO action_id';
  END IF;

  -- donation
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='donation' AND column_name='donationid') THEN
    EXECUTE 'ALTER TABLE public.donation RENAME COLUMN donationid TO donation_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='donation' AND column_name='donatorid') THEN
    EXECUTE 'ALTER TABLE public.donation RENAME COLUMN donatorid TO donator_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='donation' AND column_name='donationtypeid') THEN
    EXECUTE 'ALTER TABLE public.donation RENAME COLUMN donationtypeid TO donation_type_id';
  END IF;

  -- psychological_evaluation / outside_certification
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='psychological_evaluation' AND column_name='psychologicalevaluationid') THEN
    EXECUTE 'ALTER TABLE public.psychological_evaluation RENAME COLUMN psychologicalevaluationid TO psychological_evaluation_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='psychological_evaluation' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.psychological_evaluation RENAME COLUMN employeeid TO employee_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='outside_certification' AND column_name='outsidecertificationid') THEN
    EXECUTE 'ALTER TABLE public.outside_certification RENAME COLUMN outsidecertificationid TO outside_certification_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='outside_certification' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.outside_certification RENAME COLUMN employeeid TO employee_id';
  END IF;

  -- employee_address
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_address' AND column_name='employeeaddressid') THEN
    EXECUTE 'ALTER TABLE public.employee_address RENAME COLUMN employeeaddressid TO employee_address_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_address' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.employee_address RENAME COLUMN employeeid TO employee_id';
  END IF;

  -- vacations_request / logs
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vacations_request' AND column_name='vacationsrequestid') THEN
    EXECUTE 'ALTER TABLE public.vacations_request RENAME COLUMN vacationsrequestid TO vacations_request_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vacations_request' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.vacations_request RENAME COLUMN employeeid TO employee_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logs' AND column_name='logid') THEN
    EXECUTE 'ALTER TABLE public.logs RENAME COLUMN logid TO log_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logs' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.logs RENAME COLUMN employeeid TO employee_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logs' AND column_name='actionid') THEN
    EXECUTE 'ALTER TABLE public.logs RENAME COLUMN actionid TO action_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logs' AND column_name='ipaddress') THEN
    EXECUTE 'ALTER TABLE public.logs RENAME COLUMN ipaddress TO ip_address';
  END IF;

  -- join tables
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_backup_code' AND column_name='backupcodeid') THEN
    EXECUTE 'ALTER TABLE public.employee_backup_code RENAME COLUMN backupcodeid TO backup_code_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_backup_code' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.employee_backup_code RENAME COLUMN employeeid TO employee_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_fault' AND column_name='faultid') THEN
    EXECUTE 'ALTER TABLE public.employee_fault RENAME COLUMN faultid TO fault_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_fault' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.employee_fault RENAME COLUMN employeeid TO employee_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_workday' AND column_name='workdayid') THEN
    EXECUTE 'ALTER TABLE public.employee_workday RENAME COLUMN workdayid TO workday_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_workday' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.employee_workday RENAME COLUMN employeeid TO employee_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_inside_certification' AND column_name='insidecertificationid') THEN
    EXECUTE 'ALTER TABLE public.employee_inside_certification RENAME COLUMN insidecertificationid TO inside_certification_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_inside_certification' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.employee_inside_certification RENAME COLUMN employeeid TO employee_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_documents' AND column_name='documentid') THEN
    EXECUTE 'ALTER TABLE public.employee_documents RENAME COLUMN documentid TO document_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_documents' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.employee_documents RENAME COLUMN employeeid TO employee_id';
  END IF;

  -- house_donation
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='house_donation' AND column_name='housedonationid') THEN
    EXECUTE 'ALTER TABLE public.house_donation RENAME COLUMN housedonationid TO house_donation_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='house_donation' AND column_name='houseid') THEN
    EXECUTE 'ALTER TABLE public.house_donation RENAME COLUMN houseid TO house_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='house_donation' AND column_name='donationid') THEN
    EXECUTE 'ALTER TABLE public.house_donation RENAME COLUMN donationid TO donation_id';
  END IF;

  -- personal_event / house_event / global_event / employee_personal_event
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='personal_event' AND column_name='personaleventid') THEN
    EXECUTE 'ALTER TABLE public.personal_event RENAME COLUMN personaleventid TO personal_event_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='personal_event' AND column_name='eventtypeid') THEN
    EXECUTE 'ALTER TABLE public.personal_event RENAME COLUMN eventtypeid TO event_type_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='house_event' AND column_name='houseeventid') THEN
    EXECUTE 'ALTER TABLE public.house_event RENAME COLUMN houseeventid TO house_event_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='house_event' AND column_name='eventtypeid') THEN
    EXECUTE 'ALTER TABLE public.house_event RENAME COLUMN eventtypeid TO event_type_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='house_event' AND column_name='houseid') THEN
    EXECUTE 'ALTER TABLE public.house_event RENAME COLUMN houseid TO house_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='global_event' AND column_name='globaleventid') THEN
    EXECUTE 'ALTER TABLE public.global_event RENAME COLUMN globaleventid TO global_event_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='global_event' AND column_name='eventtypeid') THEN
    EXECUTE 'ALTER TABLE public.global_event RENAME COLUMN eventtypeid TO event_type_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='global_event' AND column_name='isfreeday') THEN
    EXECUTE 'ALTER TABLE public.global_event RENAME COLUMN isfreeday TO is_free_day';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_personal_event' AND column_name='personaleventid') THEN
    EXECUTE 'ALTER TABLE public.employee_personal_event RENAME COLUMN personaleventid TO personal_event_id';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employee_personal_event' AND column_name='employeeid') THEN
    EXECUTE 'ALTER TABLE public.employee_personal_event RENAME COLUMN employeeid TO employee_id';
  END IF;
END $$;


CREATE TABLE public.donation_type (
	donation_type_id uuid NOT NULL,
	name varchar(30) NOT NULL,
	CONSTRAINT donation_type_pk PRIMARY KEY (donation_type_id)
);

CREATE TABLE public.donator (
	donator_id uuid NOT NULL,
	name varchar(100) NOT NULL,
	CONSTRAINT donator_pk PRIMARY KEY (donator_id)
);

CREATE TABLE public.fault (
	fault_id uuid NOT NULL,
	date date NOT NULL,
	description text NOT NULL,
	CONSTRAINT fault_pk PRIMARY KEY (fault_id)
);

CREATE TABLE public.workday (
	workday_id uuid NOT NULL,
	name varchar(9) NOT NULL,
	CONSTRAINT workday_pk PRIMARY KEY (workday_id)
);

CREATE TABLE public.house (
	house_id uuid NOT NULL,
	name varchar(60) NOT NULL,
	location text NOT NULL,
	phone_number varchar(15) NOT NULL,
	description text NOT NULL,
	image varchar(100) NOT NULL,
	CONSTRAINT house_pk PRIMARY KEY (house_id)
);

CREATE TABLE public.role (
	role_id uuid NOT NULL,
	name varchar(50) NOT NULL,
	CONSTRAINT role_pk PRIMARY KEY (role_id)
);

CREATE TABLE public.employee (
	employee_id uuid NOT NULL,
	house_id uuid NOT NULL,
	role_id uuid NOT NULL,
	name varchar(50) NOT NULL,
	surname varchar(50) NOT NULL,
	is_active bool NOT NULL,
	email varchar(60) NOT NULL,
	password varchar(32) NOT NULL,
	has_first_login bool NOT NULL,
	failed_login_attempts int NOT NULL DEFAULT 0,
	totp_secret varchar(32) NULL,
	curp varchar(18) NOT NULL,
	rfc varchar(13) NULL,
	birth_date date NULL,
	picture varchar(150) NULL,
	start_date date NOT NULL,
	nss varchar(11) NULL,
	bank_account varchar(18) NULL,
	blocked_until timestamp NULL,
	temp_totp_secret varchar NULL,
	temp_totp_secret_created_at timestamp NULL,
	CONSTRAINT employee_pk PRIMARY KEY (employee_id),
	CONSTRAINT employee_house_fk FOREIGN KEY (house_id) REFERENCES public.house(house_id),
	CONSTRAINT employee_role_fk FOREIGN KEY (role_id) REFERENCES public.role(role_id)
);

CREATE TABLE public.donation (
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

CREATE TABLE public.employee_fault (
	fault_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	CONSTRAINT employee_fault_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id),
	CONSTRAINT employee_fault_fault_fk FOREIGN KEY (fault_id) REFERENCES public.fault(fault_id)
);

CREATE TABLE public.outside_certification (
	outside_certification_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	file varchar(100) NOT NULL,
	name varchar(70) NOT NULL,
	CONSTRAINT outside_certification_pk PRIMARY KEY (outside_certification_id),
	CONSTRAINT outside_certification_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE public.employee_workday (
	workday_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	start time NOT NULL,
	end time NOT NULL,
	CONSTRAINT employee_workday_workday_fk FOREIGN KEY (workday_id) REFERENCES public.workday(workday_id),
	CONSTRAINT employee_workday_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE public.psychological_evaluation (
	psychological_evaluation_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	file varchar(100) NOT NULL,
	date date NOT NULL,
	CONSTRAINT psychological_evaluation_pk PRIMARY KEY (psychological_evaluation_id)
);

CREATE TABLE public.employee_address (
	employee_address_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	url varchar(100) NOT NULL,
	date timestamp NOT NULL,
	CONSTRAINT employee_address_pk PRIMARY KEY (employee_address_id),
	CONSTRAINT employee_address_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE public.vacations_request (
	vacations_request_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	start date NOT NULL,
	end date NOT NULL,
	status int NOT NULL,
	feedback text NULL,
	CONSTRAINT vacations_request_pk PRIMARY KEY (vacations_request_id),
	CONSTRAINT vacations_request_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE public.logs (
	log_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	moment timestamp NOT NULL,
	actions int NOT NULL,
	ip_address varchar(15) NOT NULL,
	CONSTRAINT logs_pk PRIMARY KEY (log_id),
	CONSTRAINT logs_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE public.employee_backup_code (
	backup_code_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	code varchar(10) NOT NULL,
	CONSTRAINT employee_backup_code_pk PRIMARY KEY (backup_code_id),
	CONSTRAINT employee_backup_code_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE public.inside_certifications (
	inside_certification_id uuid NOT NULL,
	name varchar(70) NOT NULL,
	description text NOT NULL,
	CONSTRAINT inside_certifications_pk PRIMARY KEY (inside_certification_id)
);

CREATE TABLE public.employee_inside_certification (
	inside_certification_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	date date NOT NULL,
	CONSTRAINT employee_inside_certification_inside_certifications_fk FOREIGN KEY (inside_certification_id) REFERENCES public.inside_certifications(inside_certification_id),
	CONSTRAINT employee_inside_certification_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE public.documents (
	document_id uuid NOT NULL,
	cv varchar(100) NULL,
	birth_certificate varchar(100) NULL,
	tax_status_certificate varchar(100) NULL,
	address_certificate varchar(100) NULL,
	nss varchar(100) NULL,
	professional_id varchar(100) NULL,
	education_certificate varchar(100) NULL,
	medical_certificate varchar(100) NULL,
	state_criminal_record_certificate varchar(100) NULL,
	federal_criminal_record_certificate varchar(100) NULL,
	first_recommendation_letter varchar(100) NULL,
	second_recommendation_letter varchar(100) NULL,
	driver_license varchar(100) NULL,
	signed_regulation varchar(100) NULL,
	signed_contract varchar(100) NULL,
	signed_confidential_letter varchar(100) NULL,
	signed_ethics_letter varchar(100) NULL,
	induction_manual varchar(100) NULL,
	CONSTRAINT documents_pk PRIMARY KEY (document_id)
);

CREATE TABLE public.employee_documents (
	document_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	url varchar(100) NOT NULL,
	CONSTRAINT employee_documents_documents_fk FOREIGN KEY (document_id) REFERENCES public.documents(document_id),
	CONSTRAINT employee_documents_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);

CREATE TABLE public.event_type (
	event_type_id uuid NOT NULL,
	name varchar(30) NOT NULL,
	CONSTRAINT event_type_pk PRIMARY KEY (event_type_id)
);

CREATE TABLE public.house_donation (
	house_donation_id uuid NOT NULL,
	house_id uuid NOT NULL,
	donation_id uuid NOT NULL,
	quantity decimal NOT NULL,
	date date NOT NULL,
	CONSTRAINT house_donation_pk PRIMARY KEY (house_donation_id),
	CONSTRAINT house_donation_house_fk FOREIGN KEY (house_id) REFERENCES public.house(house_id),
	CONSTRAINT house_donation_donation_fk FOREIGN KEY (donation_id) REFERENCES public.donation(donation_id)
);

CREATE TABLE public.personal_event (
	personal_event_id uuid NOT NULL,
	event_type_id uuid NOT NULL,
	start timestamp NOT NULL,
	end timestamp NOT NULL,
	name varchar(70) NOT NULL,
	description text NOT NULL,
	CONSTRAINT personal_event_pk PRIMARY KEY (personal_event_id),
	CONSTRAINT personal_event_event_type_fk FOREIGN KEY (event_type_id) REFERENCES public.event_type(event_type_id)
);

CREATE TABLE public.house_event (
	house_event_id uuid NOT NULL,
	event_type_id uuid NOT NULL,
	house_id uuid NOT NULL,
	date date NOT NULL,
	start time NOT NULL,
	end date NOT NULL,
	name varchar(70) NOT NULL,
	description text NULL,
	CONSTRAINT house_event_pk PRIMARY KEY (house_event_id),
	CONSTRAINT house_event_event_type_fk FOREIGN KEY (event_type_id) REFERENCES public.event_type(event_type_id),
	CONSTRAINT house_event_house_fk FOREIGN KEY (house_id) REFERENCES public.house(house_id)
);

CREATE TABLE public.global_event (
	global_event_id uuid NOT NULL,
	event_type_id uuid NOT NULL,
	date date NOT NULL,
	start time NOT NULL,
	end time NOT NULL,
	name varchar(70) NOT NULL,
	description text NULL,
	is_free_day boolean NOT NULL,
	CONSTRAINT global_event_pk PRIMARY KEY (global_event_id),
	CONSTRAINT global_event_event_type_fk FOREIGN KEY (event_type_id) REFERENCES public.event_type(event_type_id)
);

CREATE TABLE public.employee_personal_event (
	personal_event_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	CONSTRAINT employee_personal_event_personal_event_fk FOREIGN KEY (personal_event_id) REFERENCES public.personal_event(personal_event_id),
	CONSTRAINT employee_personal_event_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);
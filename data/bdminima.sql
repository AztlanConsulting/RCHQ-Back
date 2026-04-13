CREATE TABLE public.donationtype (
	donationtypeid uuid NOT NULL,
	name varchar NOT NULL,
	CONSTRAINT donationtype_pk PRIMARY KEY (donationtypeid)
);

CREATE TABLE public.donator (
	donatorid uuid NOT NULL,
	name varchar NOT NULL,
	CONSTRAINT donator_pk PRIMARY KEY (donatorid)
);

CREATE TABLE public.fault (
	faultid uuid NOT NULL,
	date date NOT NULL,
	description text NOT NULL,
	CONSTRAINT fault_pk PRIMARY KEY (faultid)
);

CREATE TABLE public.workday (
	workdayid uuid NOT NULL,
	name varchar NOT NULL,
	CONSTRAINT workday_pk PRIMARY KEY (workdayid)
);

CREATE TABLE public.house (
	houseid uuid NOT NULL,
	name varchar NOT NULL,
	location text NOT NULL,
	phonenumber varchar(10) NOT NULL,
	description text NOT NULL,
	image varchar NOT NULL,
	CONSTRAINT house_pk PRIMARY KEY (houseid)
);

CREATE TABLE public.role (
	roleid uuid NOT NULL,
	name varchar NOT NULL,
	CONSTRAINT role_pk PRIMARY KEY (roleid)
);

CREATE TABLE public.employee (
	employeeid uuid NOT NULL,
	houseid uuid NOT NULL,
	roleid uuid NOT NULL,
	name varchar NOT NULL,
	surname varchar NOT NULL,
	isactive bool NULL,
	email varchar NOT NULL,
	password varchar NOT NULL,
	hasfirstlogin bool NOT NULL,
	totpsecret varchar NULL,
	curp varchar NULL,
	birthdate date NULL,
	picture varchar NULL,
	startdate date NOT NULL,
	nss varchar(11) NULL,
	bank_account varchar(18) NULL,
	CONSTRAINT employee_pk PRIMARY KEY (employeeid),
	CONSTRAINT employee_house_fk FOREIGN KEY (houseid) REFERENCES public.house(houseid),
	CONSTRAINT employee_role_fk FOREIGN KEY (roleid) REFERENCES public.role(roleid)
);

CREATE TABLE public.donation (
	donationid uuid NOT NULL,
	donatorid uuid NOT NULL,
	donationtypeid uuid NOT NULL,
	date date NOT NULL,
	product varchar NOT NULL,
	quantity decimal NOT NULL,
	measurment varchar NOT NULL,
	CONSTRAINT donation_pk PRIMARY KEY (donationid),
	CONSTRAINT donation_donator_fk FOREIGN KEY (donatorid) REFERENCES public.donator(donatorid),
	CONSTRAINT donation_donationtype_fk FOREIGN KEY (donationtypeid) REFERENCES public.donationtype(donationtypeid)
);

CREATE TABLE public.employeefault (
	faultid uuid NOT NULL,
	employeeid uuid NOT NULL,
	CONSTRAINT newtable_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid),
	CONSTRAINT newtable_fault_fk FOREIGN KEY (faultid) REFERENCES public.fault(faultid)
);

CREATE TABLE public.outsidecertification (
	outsidecertificationid uuid NOT NULL,
	employeeid uuid NOT NULL,
	file varchar NOT NULL,
	name varchar NOT NULL,
	CONSTRAINT outsidecertification_pk PRIMARY KEY (outsidecertificationid),
	CONSTRAINT outsidecertification_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid)
);

CREATE TABLE public.employeeworkday (
	workdayid uuid NOT NULL,
	employeeid uuid NOT NULL,
	start time NOT NULL,
	end time NOT NULL,
	CONSTRAINT employeeworkday_workday_fk FOREIGN KEY (workdayid) REFERENCES public.workday(workdayid),
	CONSTRAINT employeeworkday_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid)
);

CREATE TABLE public.psychologicalevaluation (
	psychologicalevaluationid uuid NOT NULL,
	employeeid uuid NOT NULL,
	file varchar NOT NULL,
	date date NOT NULL,
	CONSTRAINT psychologicalevaluation_pk PRIMARY KEY (psychologicalevaluationid)
);

CREATE TABLE public.employeeaddress (
	employeeaddressid uuid NOT NULL,
	employeeid uuid NOT NULL,
	url varchar NOT NULL,
	date timestamp NOT NULL,
	CONSTRAINT employeeaddress_pk PRIMARY KEY (employeeaddressid),
	CONSTRAINT employeeaddress_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid)
);

CREATE TABLE public.vacationsrequest (
	vacationsrequestid uuid NOT NULL,
	employeeid uuid NOT NULL,
	start date NOT NULL,
	end date NOT NULL,
	status int NOT NULL,
	feedback text NULL,
	CONSTRAINT vacationsrequest_pk PRIMARY KEY (vacationsrequestid),
	CONSTRAINT vacationsrequest_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid)
);

CREATE TABLE public.logs (
	logid uuid NOT NULL,
	employeeid uuid NOT NULL,
	moment timestamp NOT NULL,
	description varchar NOT NULL,
	ip_address varchar(15) NOT NULL,
	CONSTRAINT logs_pk PRIMARY KEY (logid),
	CONSTRAINT logs_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid)
);

CREATE TABLE public.employeebackupcode (
	backupcodeid uuid NOT NULL,
	employeeid uuid NOT NULL,
	code varchar NOT NULL,
	CONSTRAINT employeebackupcode_pk PRIMARY KEY (backupcodeid),
	CONSTRAINT employeebackupcode_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid)
);

CREATE TABLE public.insidecertifications (
	insidecertificationid uuid NOT NULL,
	name varchar NOT NULL,
	description text NOT NULL,
	CONSTRAINT insidecertifications_pk PRIMARY KEY (insidecertificationid)
);

CREATE TABLE public.employeeinsidecertification (
	insidecertificationid uuid NOT NULL,
	employeeid uuid NOT NULL,
	date date NOT NULL,
	CONSTRAINT employeeinsidecertification_insidecertifications_fk FOREIGN KEY (insidecertificationid) REFERENCES public.insidecertifications(insidecertificationid),
	CONSTRAINT employeeinsidecertification_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid)
);

CREATE TABLE public.documents (
	documentid uuid NOT NULL,
	cv varchar NULL,
	birth_certificate varchar NULL,
	tax_status_certificate varchar NULL,
	address_certificate varchar NULL,
	nss varchar NULL,
	profesional_id varchar NULL,
	education_certificate varchar NULL,
	medical_certificate varchar NULL,
	state_criminal_record_certificate varchar NULL,
	federal_criminal_record_certificate varchar NULL,
	first_recommendation_letter varchar NULL,
	second_recommendation_letter varchar NULL,
	driver_license varchar NULL,
	signed_regulation varchar NULL,
	signed_contract varchar NULL,
	signed_confidential_letter varchar NULL,
	signed_ethics_letter varchar NULL,
	induction_manual varchar NULL,
	CONSTRAINT documents_pk PRIMARY KEY (documentid)
);

CREATE TABLE public.employeedocuments (
	documentid uuid NOT NULL,
	employeeid uuid NOT NULL,
	url varchar NOT NULL,
	CONSTRAINT employeedocuments_documents_fk FOREIGN KEY (documentid) REFERENCES public.documents(documentid),
	CONSTRAINT employeedocuments_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid)
);

CREATE TABLE public.eventtype (
	eventtypeid uuid NOT NULL,
	name varchar NOT NULL,
	CONSTRAINT eventtype_pk PRIMARY KEY (eventtypeid)
);

CREATE TABLE public.housedonation (
	housedonationid uuid NOT NULL,
	houseid uuid NOT NULL,
	donationid uuid NOT NULL,
	quantity decimal NOT NULL,
	date date NOT NULL,
	CONSTRAINT housedonation_pk PRIMARY KEY (housedonationid),
	CONSTRAINT housedonation_house_fk FOREIGN KEY (houseid) REFERENCES public.house(houseid),
	CONSTRAINT housedonation_donation_fk FOREIGN KEY (donationid) REFERENCES public.donation(donationid)
);

CREATE TABLE public.personalevent (
	personaleventid uuid NOT NULL,
	eventtypeid uuid NOT NULL,
	start timestamp NOT NULL,
	end timestamp NOT NULL,
	name varchar NOT NULL,
	description text NOT NULL,
	CONSTRAINT personalevent_pk PRIMARY KEY (personaleventid),
	CONSTRAINT personalevent_eventtype_fk FOREIGN KEY (eventtypeid) REFERENCES public.eventtype(eventtypeid)
);

CREATE TABLE public.houseevent (
	houseeventid uuid NOT NULL,
	eventtypeid uuid NOT NULL,
	houseid uuid NOT NULL,
	date date NOT NULL,
	start time NOT NULL,
	end date NOT NULL,
	name varchar NOT NULL,
	description text NULL,
	CONSTRAINT houseevent_pk PRIMARY KEY (houseeventid),
	CONSTRAINT houseevent_eventtype_fk FOREIGN KEY (eventtypeid) REFERENCES public.eventtype(eventtypeid),
	CONSTRAINT houseevent_house_fk FOREIGN KEY (houseid) REFERENCES public.house(houseid)
);

CREATE TABLE public.globalevent (
	globaleventid uuid NOT NULL,
	eventtypeid uuid NOT NULL,
	date date NOT NULL,
	start time NOT NULL,
	end time NOT NULL,
	name varchar NOT NULL,
	description text NULL,
	isfreeday boolean NOT NULL,
	CONSTRAINT globalevent_pk PRIMARY KEY (globaleventid),
	CONSTRAINT globalevent_eventtype_fk FOREIGN KEY (eventtypeid) REFERENCES public.eventtype(eventtypeid)
);

CREATE TABLE public.employeepersonalevent (
	personaleventid uuid NOT NULL,
	employeeid uuid NOT NULL,
	CONSTRAINT employeepersonalevent_personalevent_fk FOREIGN KEY (personaleventid) REFERENCES public.personalevent(personaleventid),
	CONSTRAINT employeepersonalevent_employee_fk FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid)
);
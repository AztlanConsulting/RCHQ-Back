-- CreateTable
CREATE TABLE "action" (
    "action_id" CHAR(8) NOT NULL,
    "description" VARCHAR(120) NOT NULL,
    "important" BOOLEAN NOT NULL,

    CONSTRAINT "action_pk" PRIMARY KEY ("action_id")
);

-- CreateTable
CREATE TABLE "documents" (
    "document_id" UUID NOT NULL,
    "cv" VARCHAR(100),
    "birth_certificate" VARCHAR(100),
    "tax_status_certificate" VARCHAR(100),
    "address_certificate" VARCHAR(100),
    "nss" VARCHAR(100),
    "professional_id" VARCHAR(100),
    "education_certificate" VARCHAR(100),
    "medical_certificate" VARCHAR(100),
    "state_criminal_record_certificate" VARCHAR(100),
    "federal_criminal_record_certificate" VARCHAR(100),
    "first_recommendation_letter" VARCHAR(100),
    "second_recommendation_letter" VARCHAR(100),
    "driver_license" VARCHAR(100),
    "signed_regulation" VARCHAR(100),
    "signed_contract" VARCHAR(100),
    "signed_confidential_letter" VARCHAR(100),
    "signed_ethics_letter" VARCHAR(100),
    "induction_manual" VARCHAR(100),

    CONSTRAINT "documents_pk" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "donation" (
    "donation_id" UUID NOT NULL,
    "donator_id" UUID NOT NULL,
    "donation_type_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "product" VARCHAR(30) NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "measurement" VARCHAR(10) NOT NULL,

    CONSTRAINT "donation_pk" PRIMARY KEY ("donation_id")
);

-- CreateTable
CREATE TABLE "donation_type" (
    "donation_type_id" UUID NOT NULL,
    "name" VARCHAR(30) NOT NULL,

    CONSTRAINT "donation_type_pk" PRIMARY KEY ("donation_type_id")
);

-- CreateTable
CREATE TABLE "donator" (
    "donator_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "donator_pk" PRIMARY KEY ("donator_id")
);

-- CreateTable
CREATE TABLE "employee" (
    "employee_id" UUID NOT NULL,
    "house_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "surname" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "email" VARCHAR(60) NOT NULL,
    "password" VARCHAR(72) NOT NULL,
    "has_first_login" BOOLEAN NOT NULL,
    "is_active_2fa" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "failed_2fa_attempts" INTEGER NOT NULL DEFAULT 0,
    "totp_secret" VARCHAR(32),
    "curp" VARCHAR(18) NOT NULL,
    "rfc" VARCHAR(13),
    "birth_date" DATE,
    "picture" VARCHAR(150),
    "start_date" DATE NOT NULL,
    "nss" VARCHAR(11),
    "bank_account" VARCHAR(18),
    "blocked_until" TIMESTAMP(6),
    "two_fa_blocked_until" TIMESTAMP(6),
    "temp_totp_secret" VARCHAR,
    "temp_totp_secret_created_at" TIMESTAMP(6),

    CONSTRAINT "employee_pk" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "employee_address" (
    "employee_address_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "url" VARCHAR(100) NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "employee_address_pk" PRIMARY KEY ("employee_address_id")
);

-- CreateTable
CREATE TABLE "employee_backup_code" (
    "backup_code_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,

    CONSTRAINT "employee_backup_code_pk" PRIMARY KEY ("backup_code_id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "document_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "url" VARCHAR(100) NOT NULL,

    CONSTRAINT "employee_documents_pk" PRIMARY KEY ("document_id","employee_id")
);

-- CreateTable
CREATE TABLE "employee_fault" (
    "fault_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,

    CONSTRAINT "employee_fault_pk" PRIMARY KEY ("fault_id","employee_id")
);

-- CreateTable
CREATE TABLE "employee_inside_certification" (
    "inside_certification_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "employee_inside_certification_pk" PRIMARY KEY ("inside_certification_id","employee_id")
);

-- CreateTable
CREATE TABLE "employee_personal_event" (
    "personal_event_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,

    CONSTRAINT "employee_personal_event_pk" PRIMARY KEY ("personal_event_id","employee_id")
);

-- CreateTable
CREATE TABLE "employee_workday" (
    "workday_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "start" TIME(6) NOT NULL,
    "end" TIME(6) NOT NULL,

    CONSTRAINT "employee_workday_pk" PRIMARY KEY ("workday_id","employee_id")
);

-- CreateTable
CREATE TABLE "event_type" (
    "event_type_id" UUID NOT NULL,
    "name" VARCHAR(30) NOT NULL,

    CONSTRAINT "event_type_pk" PRIMARY KEY ("event_type_id")
);

-- CreateTable
CREATE TABLE "fault" (
    "fault_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "fault_pk" PRIMARY KEY ("fault_id")
);

-- CreateTable
CREATE TABLE "global_event" (
    "global_event_id" UUID NOT NULL,
    "event_type_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start" TIME(6) NOT NULL,
    "end" TIME(6) NOT NULL,
    "name" VARCHAR(70) NOT NULL,
    "description" TEXT,
    "is_free_day" BOOLEAN NOT NULL,

    CONSTRAINT "global_event_pk" PRIMARY KEY ("global_event_id")
);

-- CreateTable
CREATE TABLE "house" (
    "house_id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "location" TEXT NOT NULL,
    "phone_number" VARCHAR(15) NOT NULL,
    "description" TEXT NOT NULL,
    "image" VARCHAR(100) NOT NULL,

    CONSTRAINT "house_pk" PRIMARY KEY ("house_id")
);

-- CreateTable
CREATE TABLE "house_donation" (
    "house_donation_id" UUID NOT NULL,
    "house_id" UUID NOT NULL,
    "donation_id" UUID NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "house_donation_pk" PRIMARY KEY ("house_donation_id")
);

-- CreateTable
CREATE TABLE "house_event" (
    "house_event_id" UUID NOT NULL,
    "event_type_id" UUID NOT NULL,
    "house_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start" TIME(6) NOT NULL,
    "end" TIME(6) NOT NULL,
    "name" VARCHAR(70) NOT NULL,
    "description" TEXT,

    CONSTRAINT "house_event_pk" PRIMARY KEY ("house_event_id")
);

-- CreateTable
CREATE TABLE "inside_certifications" (
    "inside_certification_id" UUID NOT NULL,
    "name" VARCHAR(70) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "inside_certifications_pk" PRIMARY KEY ("inside_certification_id")
);

-- CreateTable
CREATE TABLE "logs" (
    "log_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "moment" TIMESTAMP(6) NOT NULL,
    "action_id" VARCHAR(8) NOT NULL,
    "affected" VARCHAR(120),
    "ip_address" VARCHAR(72) NOT NULL,

    CONSTRAINT "logs_pk" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "outside_certification" (
    "outside_certification_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "file" VARCHAR(100) NOT NULL,
    "name" VARCHAR(70) NOT NULL,

    CONSTRAINT "outside_certification_pk" PRIMARY KEY ("outside_certification_id")
);

-- CreateTable
CREATE TABLE "personal_event" (
    "personal_event_id" UUID NOT NULL,
    "event_type_id" UUID NOT NULL,
    "start" TIMESTAMP(6) NOT NULL,
    "end" TIMESTAMP(6) NOT NULL,
    "name" VARCHAR(70) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "personal_event_pk" PRIMARY KEY ("personal_event_id")
);

-- CreateTable
CREATE TABLE "psychological_evaluation" (
    "psychological_evaluation_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "file" VARCHAR(100) NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "psychological_evaluation_pk" PRIMARY KEY ("psychological_evaluation_id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "role_pk" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "vacations_request" (
    "vacations_request_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "start" DATE NOT NULL,
    "end" DATE NOT NULL,
    "status" INTEGER NOT NULL,
    "feedback" TEXT,

    CONSTRAINT "vacations_request_pk" PRIMARY KEY ("vacations_request_id")
);

-- CreateTable
CREATE TABLE "workday" (
    "workday_id" UUID NOT NULL,
    "name" VARCHAR(9) NOT NULL,

    CONSTRAINT "workday_pk" PRIMARY KEY ("workday_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donation_type_name_key" ON "donation_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_email_key" ON "employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employee_curp_key" ON "employee"("curp");

-- CreateIndex
CREATE UNIQUE INDEX "employee_rfc_key" ON "employee"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "employee_nss_key" ON "employee"("nss");

-- CreateIndex
CREATE UNIQUE INDEX "employee_backup_code_code_key" ON "employee_backup_code"("code");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_name_key" ON "event_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "house_name_key" ON "house"("name");

-- CreateIndex
CREATE UNIQUE INDEX "inside_certifications_name_key" ON "inside_certifications"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workday_name_key" ON "workday"("name");

-- AddForeignKey
ALTER TABLE "donation" ADD CONSTRAINT "donation_donation_type_fk" FOREIGN KEY ("donation_type_id") REFERENCES "donation_type"("donation_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "donation" ADD CONSTRAINT "donation_donator_fk" FOREIGN KEY ("donator_id") REFERENCES "donator"("donator_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_house_fk" FOREIGN KEY ("house_id") REFERENCES "house"("house_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_role_fk" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_address" ADD CONSTRAINT "employee_address_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_backup_code" ADD CONSTRAINT "employee_backup_code_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_documents_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("document_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_fault" ADD CONSTRAINT "employee_fault_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_fault" ADD CONSTRAINT "employee_fault_fault_fk" FOREIGN KEY ("fault_id") REFERENCES "fault"("fault_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_inside_certification" ADD CONSTRAINT "employee_inside_certification_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_inside_certification" ADD CONSTRAINT "employee_inside_certification_inside_certifications_fk" FOREIGN KEY ("inside_certification_id") REFERENCES "inside_certifications"("inside_certification_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_personal_event" ADD CONSTRAINT "employee_personal_event_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_personal_event" ADD CONSTRAINT "employee_personal_event_personal_event_fk" FOREIGN KEY ("personal_event_id") REFERENCES "personal_event"("personal_event_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_workday" ADD CONSTRAINT "employee_workday_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_workday" ADD CONSTRAINT "employee_workday_workday_fk" FOREIGN KEY ("workday_id") REFERENCES "workday"("workday_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "global_event" ADD CONSTRAINT "global_event_event_type_fk" FOREIGN KEY ("event_type_id") REFERENCES "event_type"("event_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "house_donation" ADD CONSTRAINT "house_donation_donation_fk" FOREIGN KEY ("donation_id") REFERENCES "donation"("donation_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "house_donation" ADD CONSTRAINT "house_donation_house_fk" FOREIGN KEY ("house_id") REFERENCES "house"("house_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "house_event" ADD CONSTRAINT "house_event_event_type_fk" FOREIGN KEY ("event_type_id") REFERENCES "event_type"("event_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "house_event" ADD CONSTRAINT "house_event_house_fk" FOREIGN KEY ("house_id") REFERENCES "house"("house_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_action_fk" FOREIGN KEY ("action_id") REFERENCES "action"("action_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "outside_certification" ADD CONSTRAINT "outside_certification_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personal_event" ADD CONSTRAINT "personal_event_event_type_fk" FOREIGN KEY ("event_type_id") REFERENCES "event_type"("event_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "psychological_evaluation" ADD CONSTRAINT "psychological_evaluation_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vacations_request" ADD CONSTRAINT "vacations_request_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

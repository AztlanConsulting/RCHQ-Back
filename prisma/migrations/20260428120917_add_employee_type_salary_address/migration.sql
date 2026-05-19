-- Add type, salary, end_date, phone_number to employee
-- Widen employee_address.url and add structured address columns

-- employee.type: required in schema (NOT NULL); backfill existing rows with 'nomina'
ALTER TABLE "employee" ADD COLUMN "type" VARCHAR(20);
UPDATE "employee" SET "type" = 'nomina' WHERE "type" IS NULL;
ALTER TABLE "employee" ALTER COLUMN "type" SET NOT NULL;

-- employee.salary: optional encrypted string
ALTER TABLE "employee" ADD COLUMN "salary" VARCHAR(72);

-- employee.end_date: optional
ALTER TABLE "employee" ADD COLUMN "end_date" DATE;

-- employee.phone_number: optional
ALTER TABLE "employee" ADD COLUMN "phone_number" VARCHAR(20);

-- employee_address.url: widen from VARCHAR(100) to VARCHAR(200)
ALTER TABLE "employee_address" ALTER COLUMN "url" TYPE VARCHAR(200);

-- employee_address: structured address fields (all optional)
ALTER TABLE "employee_address" ADD COLUMN "street" VARCHAR(200);
ALTER TABLE "employee_address" ADD COLUMN "municipio" VARCHAR(120);
ALTER TABLE "employee_address" ADD COLUMN "city" VARCHAR(100);
ALTER TABLE "employee_address" ADD COLUMN "postal_code" VARCHAR(10);

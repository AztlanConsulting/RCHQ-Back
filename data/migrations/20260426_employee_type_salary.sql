-- Schema: employee (end_date, phone_number), employee_address (structured address + longer url).
-- Run once after backup. Then run data/seeds scripts in numeric order (see header in each).
-- After applying, run: npx prisma db pull (optional) and npx prisma generate

BEGIN;

-- Add new columns to employee table
ALTER TABLE public.employee
  ADD COLUMN IF NOT EXISTS type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS salary INT;

-- Fill in missing values for existing users
UPDATE public.employee
SET
    type ='nomina',
    salary = 12000
WHERE email = 'andre@gmail.com';

UPDATE public.employee
SET
    type = 'voluntario',
    salary = 0
WHERE email = 'maria.operaciones@example.com';

COMMIT;

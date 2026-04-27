-- Schema: employee (end_date, phone_number), employee_address (structured address + longer url).
-- Run once after backup. Then run data/seeds scripts in numeric order (see header in each).
-- After applying, run: npx prisma db pull (optional) and npx prisma generate

BEGIN;

ALTER TABLE public.employee
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

ALTER TABLE public.employee_address
  ADD COLUMN IF NOT EXISTS street VARCHAR(200),
  ADD COLUMN IF NOT EXISTS municipio VARCHAR(120),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);

-- Allow longer Google Maps URLs on existing column
ALTER TABLE public.employee_address
  ALTER COLUMN url TYPE VARCHAR(200);

-- Fill missing values for the existing dev user (seed uses andre@gmail.com)
UPDATE public.employee
SET
  phone_number = COALESCE(phone_number, '+52 442 479 2232'),
  end_date = NULL
WHERE email = 'andre@gmail.com';

COMMIT;

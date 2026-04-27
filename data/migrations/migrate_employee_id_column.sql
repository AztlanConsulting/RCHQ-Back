-- One-off: rename PK column to match rchq_db.sql / Prisma (snake_case).
-- If this errors, run in DBeaver: 
--   SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employee';
-- and fix the first identifier below.

ALTER TABLE public.employee RENAME COLUMN employeeid TO employee_id;

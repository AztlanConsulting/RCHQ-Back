ALTER TABLE public.employee
ADD COLUMN failedloginattempts int NOT NULL DEFAULT 0;

ALTER TABLE public.employee
ADD COLUMN blockeduntil timestamp NULL;

ALTER TABLE public.employee
ADD COLUMN temptotpsecret varchar NULL;

ALTER TABLE public.employee
ADD COLUMN temptotpsecretcreatedat timestamp NULL;
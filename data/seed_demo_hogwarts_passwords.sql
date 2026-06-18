-- ============================================================
-- UPDATE PASSWORDS — Demo Hogwarts
-- Ejecutar después de seed_demo_hogwarts.sql
-- Re-run safe: idempotente por email
-- ============================================================

UPDATE public.employee
SET password = '$2b$10$4DgikxH9viz72LV8OzhjhuOIpBtxBCqeIMdi14PULkiZn42Ta6dnS'
WHERE email IN (
  'a.dumbledore@rchq.com',
  'h.potter@rchq.com',
  'r.weasley@rchq.com',
  'h.grainger@rchq.com',
  'n.longbottom@rchq.com'
);

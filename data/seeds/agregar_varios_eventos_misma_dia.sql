-- Cuatro eventos demo — 13 may 2026: tipos, alcances y horas distintas
INSERT INTO public.global_event (
  global_event_id,
  event_type_id,
  start,
  "end",
  name,
  description,
  is_free_day
)
VALUES (
  'c1000000-0000-4000-8000-000000000010',
  'b1000000-0000-4000-8000-000000000001',
  '2026-05-13 08:00:00',
  '2026-05-13 09:30:00',
  'Sync red de casas',
  'Revisión mensual con coordinadores (alcance global)',
  false
)
ON CONFLICT (global_event_id) DO NOTHING;

INSERT INTO public.global_event (
  global_event_id,
  event_type_id,
  start,
  "end",
  name,
  description,
  is_free_day
)
VALUES (
  'c1000000-0000-4000-8000-000000000011',
  'b1000000-0000-4000-8000-000000000004',
  '2026-05-13 11:00:00',
  '2026-05-13 13:00:00',
  'Capacitación ERA',
  'Evacuación y riesgos — sesión presencial',
  false
)
ON CONFLICT (global_event_id) DO NOTHING;

INSERT INTO public.house_event (
  house_event_id,
  event_type_id,
  house_id,
  date,
  start,
  "end",
  name,
  description
)
VALUES (
  'c2000000-0000-4000-8000-000000000020',
  'b1000000-0000-4000-8000-000000000002',
  (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1),
  '2026-05-13 14:00:00',
  '2026-05-13 15:00:00',
  'Visita proveedor alimentación',
  'Muestra de menú trimestral; seguimiento a compras coordinadas'
)
ON CONFLICT (house_event_id) DO NOTHING;

INSERT INTO public.personal_event (
  personal_event_id,
  event_type_id,
  start,
  "end",
  name,
  description
)
VALUES (
  'c3000000-0000-4000-8000-000000000022',
  'b1000000-0000-4000-8000-000000000003',
  '2026-05-13 16:00:00',
  '2026-05-13 17:30:00',
  'Tarea: expediente NNA',
  'Actualizar documentación en sistema'
)
ON CONFLICT (personal_event_id) DO NOTHING;

INSERT INTO public.employee_personal_event (
  personal_event_id,
  employee_id
)
VALUES (
  'c3000000-0000-4000-8000-000000000022',
  (SELECT employee_id FROM public.employee WHERE email = 'andre@gmail.com' LIMIT 1)
)
ON CONFLICT (personal_event_id, employee_id) DO NOTHING;
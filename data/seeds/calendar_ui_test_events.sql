-- ============================================================
-- UI test: dense + uneven calendar data (relative to seeded DB)
-- Intentionally fixed dates: Week of 2026-05-17 through ~three weeks ahead
-- Depends on: rchq_db.sql schema + seed.sql (event_type, houses, employee)
-- Re-run safe: primary keys unique; conflicts ignored
-- ============================================================

INSERT INTO public.global_event (
  global_event_id,
  event_type_id,
  start,
  "end",
  name,
  description,
  all_day,
  is_free_day,
  is_deleted
)
VALUES
  ('eb010001-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '2026-05-17 18:00:00', '2026-05-17 19:30:00', 'Circular fin de semana', 'Corre enviado; bloque vespertino ficticio', false, false, false),
  ('eb010001-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000004', '2026-05-18 10:00:00', '2026-05-18 12:30:00', 'Capacitación en línea · normativa', NULL, false, false, false),
  ('eb010001-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', '2026-05-19 09:00:00', '2026-05-19 10:30:00', 'Visita de supervisión zona', 'Ventana corta nacional', false, false, false),
  ('eb010001-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', '2026-05-20 11:00:00', '2026-05-20 12:30:00', 'Foro prácticas institucionales', NULL, false, false, false),
  ('eb010001-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', '2026-05-22 09:30:00', '2026-05-22 10:30:00', 'Webinar red nacional', NULL, false, false, false),
  ('eb010001-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', '2026-05-22 13:00:00', '2026-05-22 14:15:00', 'Junta de zona centro', NULL, false, false, false),
  ('eb010001-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', '2026-05-22 18:00:00', '2026-05-22 19:30:00', 'Evento vespertino institucional', NULL, false, false, false),
  ('eb010001-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000003', '2026-05-23 08:00:00', '2026-05-23 11:45:00', 'Cierre trimestral de reportes', 'Bloque largo', false, false, false),
  ('eb010001-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', '2026-05-23 15:00:00', '2026-05-23 16:00:00', 'Briefing equipo central', NULL, false, false, false),
  ('eb010001-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000001', '2026-05-26 09:30:00', '2026-05-26 10:45:00', 'Simulacro comunicación crisis', NULL, false, false, false),
  ('eb010001-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000001', '2026-05-30 07:45:00', '2026-05-30 09:00:00', 'Mantenimiento servidor (ventana)', 'Sábado temprano', false, false, false),
  ('eb010001-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000001', '2026-06-01 12:00:00', '2026-06-01 18:30:00', 'Jornada de planeación nacional', NULL, false, false, false),
  ('eb010001-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000003', '2026-06-06 09:15:00', '2026-06-06 11:45:00', 'Inventarios consolidados regional', NULL, false, false, false)
ON CONFLICT (global_event_id) DO NOTHING;

INSERT INTO public.house_event (
  house_event_id,
  event_type_id,
  house_id,
  start,
  "end",
  name,
  description,
  all_day,
  is_free_day,
  is_deleted
)
VALUES
  ('eb020001-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-18 14:30:00', '2026-05-18 16:45:00', 'Visita DIF cortesía', 'Sobrelapa parcial tarde global', false, false, false),
  ('eb020001-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', (SELECT house_id FROM public.house WHERE name = 'Sonríe villa infantil' LIMIT 1), '2026-05-20 08:00:00', '2026-05-20 11:45:00', 'Revisión infraestructura donativos', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000004', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-21 09:45:00', '2026-05-21 13:45:00', 'Capacitación cocina casa', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', (SELECT house_id FROM public.house WHERE name = 'Ammi casa infantil' LIMIT 1), '2026-05-24 09:45:00', '2026-05-24 11:00:00', 'Visita de padres provisional', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', (SELECT house_id FROM public.house WHERE name = 'Puerta Abierta I.A.P' LIMIT 1), '2026-05-25 07:55:00', '2026-05-25 09:05:00', 'Servicio urgente alumbrado', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000001', (SELECT house_id FROM public.house WHERE name = 'Senderos I.A.P' LIMIT 1), '2026-05-25 11:05:00', '2026-05-25 13:05:00', 'Logística programa escolar', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', (SELECT house_id FROM public.house WHERE name = 'Casa María Goretti I.A.P' LIMIT 1), '2026-06-07 07:41:49', '2026-06-07 07:52:53', 'Inspección anómala tardía', 'Slot raro para vista día', false, false, false),
  ('eb020001-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000003', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-22 08:30:00', '2026-05-22 09:45:00', 'Revisión lavandería y cocina', 'Día muy cargado (1/8 mismo día casa)', false, false, false),
  ('eb020001-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000001', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-22 10:00:00', '2026-05-22 11:45:00', 'Entrega y conteo donativos', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000004', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-22 12:05:00', '2026-05-22 13:05:00', 'Inducción voluntarios casa', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000002', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-22 14:35:00', '2026-05-22 15:45:00', 'Coordinación con salud casa', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000003', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-22 15:52:59', '2026-05-22 16:53:51', 'Tarea inventario dormitorios', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000001', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-22 16:00:00', '2026-05-22 17:45:00', 'Ceremonia menor fin de día', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000001', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-22 07:00:00', '2026-05-22 07:54:53', 'Apertura almacén y básculas', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000002', (SELECT house_id FROM public.house WHERE name = 'Desarrollo' LIMIT 1), '2026-05-22 17:46:53', '2026-05-22 18:29:53', 'Cierre con proveedor menor', NULL, false, false, false),
  ('eb020001-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000001', (SELECT house_id FROM public.house WHERE name = 'Ministerios Pan de Vida' LIMIT 1), '2026-05-28 11:41:51', '2026-05-28 11:53:53', 'Llamada operativa rápida', NULL, false, false, false)
ON CONFLICT (house_event_id) DO NOTHING;

INSERT INTO public.personal_event (
  personal_event_id,
  event_type_id,
  date,
  start,
  "end",
  name,
  description,
  all_day,
  is_deleted
)
VALUES
  ('eb030001-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000004', '2026-05-27', '2026-05-27 10:10:51', '2026-05-27 12:53:53', 'Curso en línea (carácter)', 'Personal prueba filtros', false, false),
  ('eb030001-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', '2026-06-03', '2026-06-03 08:43:53', '2026-06-03 09:30:53', 'Cita médica general', NULL, false, false),
  ('eb030001-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', '2026-05-22', '2026-05-22 07:53:53', '2026-05-22 08:53:53', 'Trámite antes de llegar a casa', 'Misma fecha caótica UI', false, false)
ON CONFLICT (personal_event_id) DO NOTHING;

INSERT INTO public.employee_personal_event (personal_event_id, employee_id)
SELECT pe.personal_event_id, e.employee_id
FROM public.personal_event pe
CROSS JOIN public.employee e
WHERE pe.personal_event_id IN (
    'eb030001-0000-4000-8000-000000000001',
    'eb030001-0000-4000-8000-000000000002',
    'eb030001-0000-4000-8000-000000000003'
  )
  AND e.email = 'andre@gmail.com'
ON CONFLICT (personal_event_id, employee_id) DO NOTHING;

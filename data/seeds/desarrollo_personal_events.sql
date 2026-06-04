-- ============================================================
-- Test data: personal_event + employee_personal_event for Casa Desarrollo
-- Uses employees already tied to house "Desarrollo" in seed.sql
-- Fixed calendar window: 2026-05-18 .. 2026-06-12 (overlaps calendar_ui_test_events)
-- Depends on: rchq_db.sql + seed.sql (event_type, house, employee)
-- Re-run safe: ON CONFLICT DO NOTHING on PKs
-- ============================================================

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
  ('eb040001-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', '2026-05-18', '2026-05-18 08:30:00', '2026-05-18 09:45:00', 'Dentista · revisión', NULL, false, false),
  ('eb040001-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', '2026-05-18', '2026-05-18 14:00:00', '2026-05-18 15:30:00', 'Banco · trámite', 'Ventanilla cita', false, false),
  ('eb040001-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000004', '2026-05-19', '2026-05-19 07:45:00', '2026-05-19 12:15:00', 'Curso obligatorio en línea', 'Bloque largo mañana', false, false),
  ('eb040001-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000003', '2026-05-19', '2026-05-19 16:20:00', '2026-05-19 17:50:00', 'Errand · compras urgencia', NULL, false, false),
  ('eb040001-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000001', '2026-05-20', '2026-05-20 11:00:00', '2026-05-20 11:45:00', 'Pediatra acompañar NNA', 'Documentos en carpeta azul', false, false),
  ('eb040001-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000002', '2026-05-20', '2026-05-20 18:30:00', '2026-05-20 19:15:00', 'Junta escolar (online)', NULL, false, false),
  ('eb040001-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000001', '2026-05-21', '2026-05-21 06:15:00', '2026-05-21 07:00:00', 'Gym antes de entrada', NULL, false, false),
  ('eb040001-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000004', '2026-05-21', '2026-05-21 13:05:00', '2026-05-21 15:40:00', 'Certificación primeros auxilios', 'Traer identificación', false, false),
  ('eb040001-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000003', '2026-05-22', '2026-05-22 06:30:00', '2026-05-22 08:15:00', 'Inspección vehículo (taller)', NULL, false, false),
  ('eb040001-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000001', '2026-05-22', '2026-05-22 12:50:00', '2026-05-22 13:35:00', 'Cita INE (renovación)', NULL, false, false),
  ('eb040001-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000002', '2026-05-23', '2026-05-23 09:00:00', '2026-05-23 11:30:00', 'Familia · cumpleaños', 'Sábado', false, false),
  ('eb040001-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000001', '2026-05-25', '2026-05-25 08:00:00', '2026-05-25 17:00:00', 'Día personal (bloqueado)', 'Vacaciones personales', true, false),
  ('eb040001-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000001', '2026-05-26', '2026-05-26 19:00:00', '2026-05-26 20:00:00', 'Terapia individual', NULL, false, false),
  ('eb040001-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000004', '2026-05-27', '2026-05-27 10:15:00', '2026-05-27 14:00:00', 'Taller regional (asistencia)', NULL, false, false),
  ('eb040001-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000003', '2026-05-28', '2026-05-28 07:00:00', '2026-05-28 08:30:00', 'Traslado a aeropuerto', 'Vuelo familiar', false, false),
  ('eb040001-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000002', '2026-05-28', '2026-05-28 11:20:00', '2026-05-28 12:10:00', 'Visita notaría', NULL, false, false),
  ('eb040001-0000-4000-8000-000000000017', 'b1000000-0000-4000-8000-000000000001', '2026-05-29', '2026-05-29 00:00:00', '2026-05-29 23:59:00', 'Asueto personal declarado', NULL, true, false),
  ('eb040001-0000-4000-8000-000000000018', 'b1000000-0000-4000-8000-000000000002', '2026-06-02', '2026-06-02 15:30:00', '2026-06-02 17:00:00', 'Reunión coordinación hogar', 'Prueba evento compartido (dos personas)', false, false),
  ('eb040001-0000-4000-8000-000000000019', 'b1000000-0000-4000-8000-000000000001', '2026-06-10', '2026-06-10 09:30:00', '2026-06-10 10:15:00', 'Laboratorio análisis', 'Ayuno', false, false)
ON CONFLICT (personal_event_id) DO NOTHING;

-- One row per (personal_event, employee). Event 018 is intentionally duplicated for two employees.
INSERT INTO public.employee_personal_event (personal_event_id, employee_id)
VALUES
  ('eb040001-0000-4000-8000-000000000001', (SELECT employee_id FROM public.employee WHERE email = 'andre@gmail.com' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000002', (SELECT employee_id FROM public.employee WHERE email = 'laura.mantenimiento@gmail.com' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000003', (SELECT employee_id FROM public.employee WHERE email = 'coordinador.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000004', (SELECT employee_id FROM public.employee WHERE email = 'empleado.valido.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000005', (SELECT employee_id FROM public.employee WHERE email = 'empleado.sindias.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000006', (SELECT employee_id FROM public.employee WHERE email = 'empleado.exitos.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000007', (SELECT employee_id FROM public.employee WHERE email = 'empleado.concurrencia.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000008', (SELECT employee_id FROM public.employee WHERE email = 'admin.empleado.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000009', (SELECT employee_id FROM public.employee WHERE email = 'coordinador.us32@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000010', (SELECT employee_id FROM public.employee WHERE email = 'usuario.sinpermisos.us32@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000011', (SELECT employee_id FROM public.employee WHERE email = 'empleado.valido.us32@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000012', (SELECT employee_id FROM public.employee WHERE email = 'admin.objetivo.us32@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000013', (SELECT employee_id FROM public.employee WHERE email = 'andre@gmail.com' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000014', (SELECT employee_id FROM public.employee WHERE email = 'laura.mantenimiento@gmail.com' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000015', (SELECT employee_id FROM public.employee WHERE email = 'coordinador.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000016', (SELECT employee_id FROM public.employee WHERE email = 'empleado.valido.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000017', (SELECT employee_id FROM public.employee WHERE email = 'empleado.exitos.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000018', (SELECT employee_id FROM public.employee WHERE email = 'coordinador.us30@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000018', (SELECT employee_id FROM public.employee WHERE email = 'coordinador.us32@rchq.test' LIMIT 1)),
  ('eb040001-0000-4000-8000-000000000019', (SELECT employee_id FROM public.employee WHERE email = 'admin.empleado.us30@rchq.test' LIMIT 1))
ON CONFLICT DO NOTHING;

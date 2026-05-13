-- Privilege: viewEvents — create if missing, then attach to every role (idempotent).
-- Safe to re-run: conflicts on primary keys are ignored.

INSERT INTO public.privileges (privilege_id, name)
VALUES ('00000001-0000-4000-8000-000000000007', 'viewEvents')
ON CONFLICT (privilege_id) DO NOTHING;

INSERT INTO public.role_privilege (role_id, privilege_id)
SELECT r.role_id, p.privilege_id
FROM public.role r
CROSS JOIN public.privileges p
WHERE p.name = 'viewEvents'
ON CONFLICT (role_id, privilege_id) DO NOTHING;

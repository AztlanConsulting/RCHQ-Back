const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ACTIONS = [
    {
                    action_id: "auth-001",
                    description: "Intento fallido de autenticación",
                    important: false,
                },
                {
                    action_id: "auth-002",
                    description: "Cuenta bloqueada temporalmente por múltiples intentos fallidos",
                    important: false,
                },
                {
                    action_id: "auth-003",
                    description: "Inicio de sesión exitoso",
                    important: false,
                },
                {
                    action_id: "auth-004",
                    description: "Primer acceso validado, pendiente cambio de contraseña",
                    important: false,
                },
                {
                    action_id: "auth-005",
                    description: "Cambio de contraseña en primer acceso",
                    important: false,
                },
                {
                    action_id: "auth-006",
                    description: "Inicio de sesión completado después de cambio de contraseña en primer acceso",
                    important: false,
                },
                {
                    action_id: "auth-007",
                    description: "Activación exitosa de 2FA",
                    important: false,
                },
                {
                    action_id: "auth-008",
                    description: "Activación fallida de 2FA",
                    important: false,
                },
                {
                    action_id: "auth-009",
                    description: "Fallo de autenticación 2FA",
                    important: false,
                },
                {
                    action_id: "auth-010",
                    description: "Inicio de sesión exitoso con 2FA",
                    important: false,
                },
                {
                    action_id: "auth-011",
                    description: "Desactivación exitosa de 2FA",
                    important: false,
                },
                {
                    action_id: "auth-012",
                    description: "Intento de acceso denegado: usuario inactivo",
                    important: false,
                },
                {
                    action_id: "auth-013",
                    description: "Intento de cambio de contraseña en primer acceso para usuario inactivo",
                    important: false,
                },
                {
                    action_id: "auth-014",
                    description: "Intento de configuración de 2FA para usuario inactivo",
                    important: false,
                },
                {
                    action_id: "auth-015",
                    description: "Intento de verificación 2FA para usuario inactivo",
                    important: false,
                },
                {
                    action_id: "auth-016",
                    description: "Intento de validación de 2FA para usuario inactivo",
                    important: false,
                },
                {
                    action_id: "auth-017",
                    description: "Intento de desactivación de 2FA para usuario inactivo",
                    important: false,
                },
                {
                    action_id: "auth-018",
                    description: "Fallo de desactivación de 2FA por contraseña incorrecta",
                    important: false,
                },
                {
                    action_id: "auth-019",
                    description: "2FA bloqueado temporalmente por múltiples intentos fallidos",
                    important: false,
                },
                {
                    action_id: "empl-001",
                    description: "Empleado creado",
                    important: false,
                },
                {
                    action_id: "auth-020",
                    description: "Cambio de contraseña exitoso",
                    important: false,
                },
                {
                    action_id: "auth-021",
                    description: "Intento de cambio de contraseña con usuario inactivo",
                    important: false,
                },
                {
                    action_id: "auth-022",
                    description: "Fallo de cambio de contraseña por contraseña actual incorrecta",
                    important: false,
                },
];

async function seedActions(db = prisma) {
    await db.action.createMany({
        data: ACTIONS,
        skipDuplicates: true,
    });
}

module.exports = {
    seedActions,
    ACTIONS,
};
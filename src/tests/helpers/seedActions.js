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
        description:
            "Cuenta bloqueada temporalmente por múltiples intentos fallidos",
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
        description:
            "Inicio de sesión completado después de cambio de contraseña en primer acceso",
        important: false,
    },
    {
        action_id: "auth-007",
        description: "Activación exitosa de autenticación en dos pasos",
        important: false,
    },
    {
        action_id: "auth-008",
        description: "Activación fallida de autenticación en dos pasos",
        important: false,
    },
    {
        action_id: "auth-009",
        description: "Fallo de autenticación autenticación en dos pasos",
        important: false,
    },
    {
        action_id: "auth-010",
        description: "Inicio de sesión exitoso con autenticación en dos pasos",
        important: false,
    },
    {
        action_id: "auth-011",
        description: "Desactivación exitosa de autenticación en dos pasos",
        important: false,
    },
    {
        action_id: "auth-012",
        description: "Intento de acceso denegado: usuario inactivo",
        important: false,
    },
    {
        action_id: "auth-013",
        description:
            "Intento de cambio de contraseña en primer acceso para usuario inactivo",
        important: false,
    },
    {
        action_id: "auth-014",
        description:
            "Intento de configuración de autenticación en dos pasos para usuario inactivo",
        important: false,
    },
    {
        action_id: "auth-015",
        description:
            "Intento de verificación autenticación en dos pasos para usuario inactivo",
        important: false,
    },
    {
        action_id: "auth-016",
        description:
            "Intento de validación de autenticación en dos pasos para usuario inactivo",
        important: false,
    },
    {
        action_id: "auth-017",
        description:
            "Intento de desactivación de autenticación en dos pasos para usuario inactivo",
        important: false,
    },
    {
        action_id: "auth-018",
        description:
            "Fallo de desactivación de autenticación en dos pasos por contraseña incorrecta",
        important: false,
    },
    {
        action_id: "auth-019",
        description:
            "Autenticación en dos pasos bloqueada temporalmente por múltiples intentos fallidos",
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
        description:
            "Fallo de cambio de contraseña por contraseña actual incorrecta",
        important: false,
    },
    {
        action_id: "vaca-001",
        description: "Creación de solicitud de vacaciones exitosa",
        important: false,
    },
    {
        action_id: "vaca-002",
        description: "Registro de vacaciones de empleado exitoso",
        important: false,
    },
    {
        action_id: "ausn-003",
        description: "Creación de ausencia exitosa",
        important: false,
    },
    {
        action_id: "ausn-001",
        description: "Actualización de ausencia exitosa",
        important: false,
    },
    {
        action_id: "ausn-002",
        description: "Eliminación de ausencia exitosa",
        important: false,
    },
    {
        action_id: "empl-005",
        description: "Información de empleado actualizada",
        important: false,
    },
    {
        action_id: "even-001",
        description: "Evento de casa creado con éxito",
        important: false,
    },
    {
        action_id: "even-002",
        description: "Evento personal creado con éxito",
        important: false,
    },
    {
        action_id: "even-003",
        description: "Evento personal asignado a empleado",
        important: false,
    },
    {
        action_id: "even-004",
        description: "Evento de casa asignado a casa",
        important: false,
    },
    {
        action_id: "even-005",
        description: "Evento de casa eliminado con éxito",
        important: true,
    },
    {
        action_id: "vaca-005",
        description: "Modificación de vacaciones exitosa",
        important: false,
    },
    {
        action_id: "empl-006",
        description: "Empleado dado de baja",
        important: true,
    },
    {
        action_id: "empl-008",
        description: "Fallo al dar de baja al empleado",
        important: true,
        action_id: "vaca-006",
        description: "Eliminación de vacaciones exitosa",
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

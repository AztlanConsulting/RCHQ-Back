const { z } = require("zod");

const deactivateEmployeeSchema = z.object({
    reason: z
        .string()
        .max(250, { message: 'El campo "Razón" es de máximo 250 caracteres' })
        .regex(/^[^<>]*$/, { message: 'El campo "Razón" contiene caracteres no permitidos' })
        .optional(),
    addToBlacklist: z.boolean().optional(),
});

const deactivateEmployeeParamsSchema = z.object({
    employeeId: z.uuidv4({ message: "El ID del empleado no es válido" }),
});

module.exports = { deactivateEmployeeSchema, deactivateEmployeeParamsSchema };

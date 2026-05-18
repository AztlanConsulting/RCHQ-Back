const { z } = require("zod");

const deactivateEmployeeSchema = z.object({
    reason: z
        .string({ required_error: 'El campo "Razón" no debe estar vacío' })
        .min(1, { message: 'El campo "Razón" no debe estar vacío' })
        .max(250, { message: 'El campo "Razón" es de máximo 250 caracteres' }),
});

const deactivateEmployeeParamsSchema = z.object({
    employeeId: z.uuidv4({ message: "El ID del empleado no es válido" }),
});

module.exports = { deactivateEmployeeSchema, deactivateEmployeeParamsSchema };

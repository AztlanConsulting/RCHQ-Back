const { z } = require("zod");

const deactivateEmployeeSchema = z.object({
    reason: z
        .string()
        .max(250, { message: 'El campo "Razón" es de máximo 250 caracteres' })
        .regex(/^[^<>]*$/, { message: 'El campo "Razón" contiene caracteres no permitidos' })
        .optional(),
    addToBlacklist: z.boolean().optional(),
}).refine((data) => {
    if (data.addToBlacklist && (!data.reason || data.reason.trim() === "")) {
        return false;
    }
    return true;
}, { message: "El campo 'Razón' es obligatorio para añadir a la lista negra.", path: ["reason"] });

const deactivateEmployeeParamsSchema = z.object({
    employeeId: z.uuidv4({ message: "El ID del empleado no es válido" }),
});

const reactivateEmployeeParamsSchema = deactivateEmployeeParamsSchema;

module.exports = {
    deactivateEmployeeSchema,
    deactivateEmployeeParamsSchema,
    reactivateEmployeeParamsSchema,
};

const { z } = require("zod");
const REASON_REGEX = /^[a-zA-Z0-9\s.,!?áéíóúÁÉÍÓÚñÑ-]*$/;

exports.deactivateEmployeeSchema = z.object({
    reason: z
        .string()
        .trim()
        .max(250, { message: "La razón no puede exceder los 250 caracteres." })
        .regex(
            REASON_REGEX,
            { message: "La razón solo admite letras, números y signos básicos." },
        )
        .optional(),
    addToBlacklist: z.boolean().optional(),
}).refine((data) => {
    if (data.addToBlacklist && (!data.reason || data.reason.trim() === "")) {
        return false;
    }
    return true;
}, {
    message: "La razón es obligatoria para agregar al empleado a la lista negra durante la baja.",
    path: ["reason"],
});

exports.deactivateEmployeeParamsSchema = z.object({
    employeeId: z.uuidv4({ message: "El ID del empleado no es válido" }),
});
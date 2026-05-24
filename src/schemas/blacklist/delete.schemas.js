const { z } = require("zod");

const blacklistDeleteSchema = z.object({
    curp: z
        .string({
            required_error: "La CURP es requerida",
            invalid_type_error: "La CURP debe ser texto",
        })
        .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}\w\d$/, "Formato de CURP inválido"),
    reason: z
        .string({
            required_error: "La razón es obligatoria",
        })
        .trim()
        .min(1, "La razón no puede estar vacía.")
        .max(250, "La razón no puede exceder los 250 caracteres."),
});

module.exports = {
    blacklistDeleteSchema,
};
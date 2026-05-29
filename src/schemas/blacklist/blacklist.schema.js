const { z } = require("zod");
const REASON_REGEX = /^[a-zA-Z0-9\s.,!?áéíóúÁÉÍÓÚñÑ-]*$/;

exports.blacklistCreateSchema = z.object({
    curp: z
        .string({
            required_error: "La CURP es requerida",
            invalid_type_error: "La CURP debe ser texto",
        })
        .trim()
        .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}\w\d$/, "La CURP tiene un formato inválido."),
    reason: z
        .string({
            required_error: "La razón es obligatoria.",
        })
        .trim()
        .min(1, "La razón no puede estar vacía.")
        .max(250, "La razón no puede exceder los 250 caracteres.")
        .regex(
            REASON_REGEX,
            "La razón solo admite letras, números y signos básicos.",
        ),
});

exports.blacklistDeleteSchema = z.object({
    curp: z
        .string({
            required_error: "La CURP es requerida",
            invalid_type_error: "La CURP debe ser texto",
        })
        .trim()
        .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}\w\d$/, "La CURP tiene un formato inválido."),
    reason: z
        .string({
            required_error: "La razón es obligatoria.",
        })
        .trim()
        .min(1, "La razón no puede estar vacía.")
        .max(250, "La razón no puede exceder los 250 caracteres.")
        .regex(
            REASON_REGEX,
            "La razón solo admite letras, números y signos básicos.",
        ),
});

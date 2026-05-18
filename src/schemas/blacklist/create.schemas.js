const { z } = require("zod");

const blacklistCreateSchema = z.object({
    curp: z
        .string({
            required_error: "La CURP es requerida",
            invalid_type_error: "La CURP debe ser texto",
        })
        .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}\w\d$/, "Formato de CURP inválido"),
});

module.exports = {
    blacklistCreateSchema,
};

const { z } = require("zod");

const getBlacklistSchema = z.object({
    page: z
        .string()
        .optional()
        .default("1")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, { message: "La página debe ser mayor a 0" }),
    limit: z
        .string()
        .optional()
        .default("10")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, { message: "El límite debe ser mayor a 0" }),
    curp: z.string().optional(),
    search: z.string().optional(),
    isBlacklisted: z
        .string()
        .optional()
        .refine((val) => val === undefined || val === "true" || val === "false", {
            message: "isBlacklisted debe ser 'true' o 'false'",
        })
        .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
});

module.exports = { getBlacklistSchema };

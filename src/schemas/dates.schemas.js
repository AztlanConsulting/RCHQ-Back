const { z } = require("zod");
const { isValidDate } = require("../utils/dates");

const STRING_DATE = /^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/;

exports.dateRangeSchema = z.object({
    startDate: z
        .string()
        .regex(STRING_DATE, "La fecha no sigue el formato YYYY-MM-DD")
        .refine(isValidDate, {
            message: "La fecha proporcionada es inválida",
        }),

    endDate: z
        .string()
        .regex(STRING_DATE, "La fecha no sigue el formato YYYY-MM-DD")
        .refine(isValidDate, {
            message: "La fecha proporcionada es inválida",
        }),
});

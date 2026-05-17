const { z } = require("zod");

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isRealISODate(dateString) {
    if (!ISO_DATE_REGEX.test(dateString)) return false;

    const [year, month, day] = dateString.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
}

const dateStringSchema = z
    .string({
        required_error: "La fecha es requerida",
        invalid_type_error: "La fecha debe ser texto",
    })
    .refine(isRealISODate, {
        message: "La fecha debe existir y tener formato YYYY-MM-DD",
    });

const employeeVacationCreateSchema = z.object({
    params: z.object({
        employeeId: z
            .string({
                required_error: "El id del empleado es requerido",
                invalid_type_error: "El id del empleado debe ser texto",
            })
            .uuid("El id del empleado debe ser un UUID válido"),
    }),
    body: z.object({
        startDate: dateStringSchema,
        endDate: dateStringSchema,
    }),
});

module.exports = {
    employeeVacationCreateSchema,
};

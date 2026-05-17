const { z } = require("zod");

const UUID_SCHEMA = z.string().uuid("ID inválido");
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const FEEDBACK_SCHEMA = z
    .string({
        invalid_type_error: "El feedback debe ser texto",
    })
    .trim()
    .max(500, "El feedback no puede superar 500 caracteres")
    .optional();

exports.approveVacationRequestSchema = z.object({
    params: z.object({
        vacationRequestId: UUID_SCHEMA,
    }),
    body: z.object({}).strict().optional(),
    query: z.object({}).strict().optional(),
});

exports.approveVacationRequestInputSchema = z.object({
    actorEmployeeId: UUID_SCHEMA,
    vacationRequestId: UUID_SCHEMA,
    ipAddress: z.string().optional(),
});

exports.rejectVacationRequestSchema = z.object({
    params: z.object({
        vacationRequestId: UUID_SCHEMA,
    }),
    body: z
        .object({
            feedback: FEEDBACK_SCHEMA,
        })
        .strict()
        .optional(),
    query: z.object({}).strict().optional(),
});

exports.rejectVacationRequestInputSchema = z.object({
    actorEmployeeId: UUID_SCHEMA,
    vacationRequestId: UUID_SCHEMA,
    feedback: FEEDBACK_SCHEMA,
    ipAddress: z.string().optional(),
});

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

const DATE_SCHEMA = z
    .string({
        required_error: "La fecha es requerida",
        invalid_type_error: "La fecha debe ser texto",
    })
    .refine(isRealISODate, {
        message: "La fecha debe existir y tener formato YYYY-MM-DD",
    });

exports.updateVacationRequestDatesSchema = z.object({
    params: z.object({
        vacationRequestId: UUID_SCHEMA,
    }),
    body: z
        .object({
            startDate: DATE_SCHEMA,
            endDate: DATE_SCHEMA,
        })
        .strict(),
    query: z.object({}).strict().optional(),
});

exports.updateVacationRequestDatesInputSchema = z.object({
    actorEmployeeId: UUID_SCHEMA,
    vacationRequestId: UUID_SCHEMA,
    rawStartDate: DATE_SCHEMA,
    rawEndDate: DATE_SCHEMA,
    ipAddress: z.string().optional(),
});

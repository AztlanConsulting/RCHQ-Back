const { z } = require("zod");
const { isRealISODate } = require("../../utils/vacation/isoDate");

const UUID_SCHEMA = z.string().uuid("ID inválido");
const EMOJI_SEQUENCE_REGEX =
    "(?:\\p{Regional_Indicator}{2}|\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?)*)";
const FEEDBACK_ALLOWED_CHARS_REGEX = new RegExp(
    `^(?:[\\p{L}\\p{M}\\p{N} \\r\\n.,:;()¿?¡!/-]|${EMOJI_SEQUENCE_REGEX})*$`,
    "u",
);

const FEEDBACK_SCHEMA = z
    .string({
        invalid_type_error: "El feedback debe ser texto",
    })
    .trim()
    .max(500, "El feedback no puede superar 500 caracteres")
    .regex(
        FEEDBACK_ALLOWED_CHARS_REGEX,
        "El feedback solo puede contener letras, números, espacios y signos básicos",
    )
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

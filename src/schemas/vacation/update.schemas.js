const { z } = require("zod");

const UUID_SCHEMA = z.string().uuid("ID inválido");

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
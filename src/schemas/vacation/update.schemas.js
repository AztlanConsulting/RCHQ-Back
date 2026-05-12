const { z } = require("zod");

const UUID_SCHEMA = z.string().uuid("ID inválido");

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

const { z } = require("zod");

const UUID_SCHEMA = z.string().uuid("ID inválido");

exports.absenceDeleteSchema = z.object({
    params: z.object({
        absenceId: UUID_SCHEMA,
    }),
    body: z.object({}).strict().optional(),
    query: z.object({}).strict().optional(),
});

exports.absenceDeleteInputSchema = z.object({
    actorEmployeeId: UUID_SCHEMA,
    absenceId: UUID_SCHEMA,
});

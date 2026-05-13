const { z } = require("zod");
const { isValidDate } = require("../../utils/dates");

const UUID_SCHEMA = z.string().uuid("ID inválido");

const emptyToNull = (value) => value === "" ? null : value;

const dateField = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .refine((value) => isValidDate(value), "Fecha inválida");

const absenceUpdateBodySchema = z.object({
    absenceTypeId: UUID_SCHEMA.optional(),
    description: z.string()
        .trim()
        .transform(emptyToNull)
        .nullable()
        .optional(),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
}).strict().refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Debe enviarse al menos un campo para actualizar" },
);

exports.absenceUpdateSchema = z.object({
    params: z.object({
        absenceId: UUID_SCHEMA,
    }),
    body: absenceUpdateBodySchema,
    query: z.object({}).strict().optional(),
});

exports.absenceUpdateInputSchema = z.object({
    actorEmployeeId: UUID_SCHEMA,
    absenceId: UUID_SCHEMA,
    body: absenceUpdateBodySchema,
});


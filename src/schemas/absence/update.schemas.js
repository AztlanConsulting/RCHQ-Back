const { z } = require("zod");
const { isValidDate } = require("../../utils/dates");

const UUID_SCHEMA = z.string().uuid("ID inválido");
const ABSENCE_DESCRIPTION_PATTERN = /^[\p{L}\p{N}\s¿?¡!]+$/u;

const emptyToNull = (value) => (value === "" ? null : value);

const dateField = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .refine((value) => isValidDate(value), "Fecha inválida");

const absenceUpdateBodySchema = z
    .object({
        absenceTypeId: UUID_SCHEMA.optional(),
        description: z
            .string()
            .trim()
            .max(200, "La descripción no puede exceder 200 caracteres")
            .transform(emptyToNull)
            .refine(
                (value) =>
                    value === null || ABSENCE_DESCRIPTION_PATTERN.test(value),
                "La descripción solo puede contener letras, números, espacios y signos de interrogación o exclamación",
            )
            .nullable()
            .optional(),
        startDate: dateField.optional(),
        endDate: dateField.optional(),
        hasEvidenceFile: z.boolean().optional(),
    })
    .strict()
    .refine(
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

const { z } = require("zod");
const { isValidDate, stringToDate } = require("../../utils/dates");

const UUID_SCHEMA = z.string().uuid("ID inválido");
const ABSENCE_DESCRIPTION_PATTERN = /^[\p{L}\p{N}\s¿?¡!]+$/u;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

const emptyToNull = (value) => value === "" ? null : value;

const getAbsenceDateLimits = () => {
    const today = new Date();

    return {
        minDate: new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth() - 1,
            today.getUTCDate(),
        )),
        maxDate: new Date(Date.UTC(
            today.getUTCFullYear() + 1,
            today.getUTCMonth(),
            today.getUTCDate(),
        )),
    };
};

const isValidDateField = (value) =>
    typeof value === "string" &&
    DATE_FORMAT.test(value) &&
    isValidDate(value);

const dateField = z.string()
    .regex(DATE_FORMAT, "Formato de fecha inválido (YYYY-MM-DD)")
    .refine((value) => isValidDate(value), "Fecha inválida");

const absenceUpdateBodySchema = z.object({
    absenceTypeId: UUID_SCHEMA.optional(),
    description: z.string()
        .trim()
        .max(200, "La descripción no puede exceder 200 caracteres")
        .transform(emptyToNull)
        .refine(
            (value) => value === null || ABSENCE_DESCRIPTION_PATTERN.test(value),
            "La descripción solo puede contener letras, números, espacios y signos de interrogación o exclamación",
        )
        .nullable()
        .optional(),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
    hasEvidenceFile: z.boolean().optional(),
}).strict().refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Debe enviarse al menos un campo para actualizar" },
).superRefine((data, ctx) => {
    const { minDate, maxDate } = getAbsenceDateLimits();

    if (isValidDateField(data.startDate)) {
        const startDate = stringToDate(data.startDate);

        if (startDate < minDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["startDate"],
                message: "Fecha de inicio no puede ser menor a un mes antes del día actual",
            });
        }

        if (startDate > maxDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["startDate"],
                message: "Fecha de inicio no puede ser mayor a un año después del día actual",
            });
        }
    }

    if (isValidDateField(data.endDate)) {
        const endDate = stringToDate(data.endDate);

        if (endDate < minDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["endDate"],
                message: "Fecha de fin no puede ser menor a un mes antes del día actual",
            });
        }

        if (endDate > maxDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["endDate"],
                message: "Fecha de fin no puede ser mayor a un año después del día actual",
            });
        }
    }
});

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

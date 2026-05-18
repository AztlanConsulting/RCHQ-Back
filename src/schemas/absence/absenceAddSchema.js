const { z } = require("zod");
const { isValidDate, stringToDate } = require("../../utils/dates");

const UUID_SCHEMA = z
    .string({ error: "Campo obligatorio" })
    .trim()
    .min(1, "Campo obligatorio")
    .pipe(z.string().uuid("ID inválido"));

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const ABSENCE_DESCRIPTION_PATTERN = /^[\p{L}\p{N}\s¿?¡!,.\-+#"_]+$/u;
const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EVIDENCE_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
];

const dateField = z
    .string({ error: "Campo obligatorio" })
    .trim()
    .min(1, "Campo obligatorio")
    .pipe(
        z
            .string()
            .length(10, "El tamaño de la fecha debe ser de 10 caracteres"),
    )
    .pipe(
        z
            .string()
            .regex(DATE_FORMAT, "Fecha solo puede tener un formato YYYY-MM-DD"),
    )
    .pipe(z.string().refine(isValidDate, "Fecha inválida"));

const descriptionField = z
    .string({ error: "Campo obligatorio" })
    .trim()
    .min(1, "Campo obligatorio")
    .pipe(
        z.string().max(200, "Descripción no puede ser mayor a 200 caracteres"),
    )
    .pipe(
        z
            .string()
            .regex(
                ABSENCE_DESCRIPTION_PATTERN,
                "Descripción no permite caracteres especiales",
            ),
    );

const fileSchema = z
    .object({
        mimetype: z
            .string()
            .refine(
                (mimetype) => ALLOWED_EVIDENCE_MIME_TYPES.includes(mimetype),
                "Formato invalido de ausencias",
            ),
        size: z
            .number({ error: "tamaño superior a 10mb" })
            .max(MAX_EVIDENCE_FILE_SIZE, "tamaño superior a 10mb"),
    })
    .passthrough()
    .optional();

exports.absenceAddSchema = z
    .object({
        actorEmployeeId: UUID_SCHEMA,
        targetEmployeeId: UUID_SCHEMA,
        body: z
            .object({
                absenceTypeId: UUID_SCHEMA,
                startDate: dateField,
                endDate: dateField,
                description: descriptionField,
                hasEvidenceFile: z.boolean().optional(),
            })
            .strict(),
        file: fileSchema,
    })
    .superRefine((data, ctx) => {
        const startDate = stringToDate(data.body.startDate);
        const endDate = stringToDate(data.body.endDate);
        const today = new Date();
        const minStartDate = new Date(
            Date.UTC(
                today.getUTCFullYear(),
                today.getUTCMonth() + 1,
                today.getUTCDate(),
            ),
        );
        const maxEndDate = new Date(
            Date.UTC(
                today.getUTCFullYear() + 1,
                today.getUTCMonth(),
                today.getUTCDate(),
            ),
        );

        if (startDate > endDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["body", "startDate"],
                message: "Fecha de inicio no puede mayor a la de fin",
            });
        }

        if (startDate < minStartDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["body", "startDate"],
                message: "Fecha de inicio no puede ser menor a un mes",
            });
        }

        if (endDate > maxEndDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["body", "endDate"],
                message: "Fecha de fin no puede ser mayor a un año",
            });
        }
    });

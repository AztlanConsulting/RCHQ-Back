const { z } = require("zod");

const TEXT_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s\-!¿¡?.,:;()]+$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_WITH_TIMEZONE_REGEX =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const dateOnlyToUtcDate = (value) => new Date(`${value}T00:00:00.000Z`);

const houseEventCreateSchema = z
    .object({
        event_type_id: z
            .string({ error: "El event_type_id debe de ser obligatorio" })
            .uuid({ message: "El identificador del evento no es válido." }),

        house_id: z
            .string({ error: "El house_id debe de ser obligatorio" })
            .uuid({ message: "El identificador de casa no es válido." }),

        name: z
            .string({ error: "El titulo es obligatorio." })
            .trim()
            .min(1, { message: "El título es obligatorio." })
            .max(70, { message: "El título no debe exceder 70 caracteres." })
            .regex(TEXT_REGEX, {
                message:
                    "Solo se permiten letras, números, espacios y signos básicos.",
            }),

        start: z.string({
            error: "La fecha de inicio es obligatoria.",
        }),

        end: z.string({
            error: "La fecha de fin es obligatoria.",
        }),

        all_day: z
            .boolean({
                error: "El campo all_day debe ser verdadero o falso.",
            })
            .optional()
            .default(false),

        is_free_day: z
            .boolean({
                error: "El campo is_free_day debe ser verdadero o falso.",
            })
            .optional()
            .default(false),

        description: z
            .string()
            .trim()
            .max(250, {
                message: "La descripción no debe exceder los 250 caracteres.",
            })
            .regex(TEXT_REGEX, {
                message:
                    "Solo se permiten letras, números, espacios y signos básicos.",
            })
            .nullable()
            .optional(),

        forceOverlap: z
            .boolean({
                error: "El campo forceOverlap debe ser verdadero o falso.",
            })
            .optional()
            .default(false),
    })
    .superRefine((data, ctx) => {
        if (data.all_day) {
            if (!DATE_ONLY_REGEX.test(data.start)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["start"],
                    message:
                        "Para eventos de todo el día, start debe tener formato YYYY-MM-DD.",
                });
            }

            if (!DATE_ONLY_REGEX.test(data.end)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["end"],
                    message:
                        "Para eventos de todo el día, end debe tener formato YYYY-MM-DD.",
                });
            }

            return;
        }

        if (!DATETIME_WITH_TIMEZONE_REGEX.test(data.start)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["start"],
                message:
                    "Para eventos con hora, start debe incluir fecha, hora y zona horaria.",
            });
        }

        if (!DATETIME_WITH_TIMEZONE_REGEX.test(data.end)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["end"],
                message:
                    "Para eventos con hora, end debe incluir fecha, hora y zona horaria.",
            });
        }
    })
    .transform((data, ctx) => {
        let start;
        let end;

        if (data.all_day) {
            start = dateOnlyToUtcDate(data.start);
            end = dateOnlyToUtcDate(data.end);

            // Para eventos all_day, end es exclusivo: sumamos un día
            // para que el rango represente correctamente la duración real.
            // Ejemplo: usuario manda "15 al 15" → BD guarda [15T00:00, 16T00:00).
            if (!isNaN(end.getTime())) {
                end = new Date(end.getTime() + ONE_DAY_MS);
            }
        } else {
            start = new Date(data.start);
            end = new Date(data.end);
        }

        if (isNaN(start.getTime())) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["start"],
                message: "La fecha de inicio no es una fecha válida.",
            });
            return z.NEVER;
        }

        if (isNaN(end.getTime())) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["end"],
                message: "La fecha de fin no es una fecha válida.",
            });
            return z.NEVER;
        }

        return { ...data, start, end };
    })
    .refine((data) => data.start < data.end, {
        message: "La fecha de inicio debe ser anterior a la fecha de fin.",
        path: ["start"],
    });

exports.houseEventCreateSchema = houseEventCreateSchema;

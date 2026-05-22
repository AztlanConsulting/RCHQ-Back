const { z } = require("zod");

const TEXT_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s\-!¿¡?.,:;()]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const DATETIME_WITH_TIMEZONE_REGEX =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const dateOnlyToUtcDate = (value) => new Date(`${value}T06:00:00.000Z`);

exports.houseEventCreateSchema = z
    .object({
        eventTypeId: z
            .string({ error: "El eventTypeId debe de ser obligatorio" })
            .uuid({ message: "El identificador del evento no es válido." }),

        houseId: z
            .string({ error: "El houseId debe de ser obligatorio" })
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

        allDay: z
            .boolean({
                error: "El campo allDay debe ser verdadero o falso.",
            })
            .optional()
            .default(false),

        isFreeDay: z
            .boolean({
                error: "El campo isFreeDay debe ser verdadero o falso.",
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
        if (data.allDay) {
            if (!DATE_REGEX.test(data.start)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["start"],
                    message:
                        "Para eventos de todo el día, start debe tener formato YYYY-MM-DD.",
                });
            }

            if (!DATE_REGEX.test(data.end)) {
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

        if (data.allDay) {
            start = dateOnlyToUtcDate(data.start);
            end = dateOnlyToUtcDate(data.end);

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

exports.createPersonalEventSchema = z
    .object({
        name: z
            .string({ required_error: "El nombre es obligatorio." })
            .trim()
            .min(1, { message: "El nombre no puede estar vacío." })
            .max(70, {
                message: `El nombre no debe exceder 70 caracteres.`,
            })
            .regex(TEXT_REGEX, {
                message:
                    "Solo se permiten letras, números, espacios y signos básicos.",
            }),

        eventTypeId: z
            .string({ required_error: "El tipo de evento es obligatorio" })
            .uuid("El tipo de evento debe ser un UUID válido"),

        date: z
            .string({ required_error: "La fecha es obligatoria" })
            .regex(DATE_REGEX, "La fecha debe tener formato YYYY-MM-DD"),

        description: z
            .string()
            .trim()
            .max(250, {
                message: `La descripción no debe exceder los 250 caracteres.`,
            })
            .regex(TEXT_REGEX, {
                message:
                    "Solo se permiten letras, números, espacios y signos básicos.",
            })
            .nullable()
            .optional(),

        allDay: z.boolean({ required_error: "El campo allDay es obligatorio" }),

        start: z
            .string()
            .regex(
                TIME_REGEX,
                "La hora de inicio debe tener formato HH:mm o HH:mm:ss",
            )
            .optional(),

        end: z
            .string()
            .regex(
                TIME_REGEX,
                "La hora de fin debe tener formato HH:mm o HH:mm:ss",
            )
            .optional(),

        employeeIds: z
            .array(
                z.string().uuid("Los IDs de empleados deben ser UUIDs válidos"),
            )
            .optional(),

        forceOverlap: z.boolean().optional().default(false),
    })
    .superRefine((data, ctx) => {
        if (data.allDay === true) {
            return;
        }

        if (!data.start) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["start"],
                message:
                    "La hora de inicio es obligatoria cuando allDay es false",
            });
        }

        if (!data.end) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["end"],
                message: "La hora de fin es obligatoria cuando allDay es false",
            });
        }

        if (data.start && data.end && data.end <= data.start) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["end"],
                message: "La hora de fin debe ser mayor que la hora de inicio",
            });
        }
    });

exports.searchEmployeesSchema = z.object({
    search: z
        .string()
        .trim()
        .max(100, { message: "La búsqueda no debe exceder 100 caracteres." })
        .optional(),
});

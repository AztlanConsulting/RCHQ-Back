const { z } = require("zod");
const { 
    normalizeTime,
    TIME_REGEX,
    DATETIME_WITH_TIMEZONE_REGEX,
    DATE_ONLY_REGEX,
    TEXT_REGEX,
    ONE_DAY_MS,
    dateOnlyToMexicoUtcStart,
    eventDateTimeToUtc,
    getTodayStr,
    getMaxDateStr,
    getHouseMinDateStr,
    getHouseMaxDateStr
} = require("../../utils/event/dateTime");

const isDateOrDateTimeWithTimezone = (value) =>
    DATE_ONLY_REGEX.test(value) || DATETIME_WITH_TIMEZONE_REGEX.test(value);
const isTimeOrDateTimeWithTimezone = (value) =>
    TIME_REGEX.test(value) || DATETIME_WITH_TIMEZONE_REGEX.test(value);

const eventEndDateTimeForValidation = (date, value) => {
    if (DATETIME_WITH_TIMEZONE_REGEX.test(value)) return new Date(value);
    const resolvedDate =
        String(value).slice(0, 5) === "00:00"
            ? new Date(new Date(`${date}T00:00:00.000Z`).getTime() + ONE_DAY_MS)
                  .toISOString()
                  .slice(0, 10)
            : date;
    return eventDateTimeToUtc(resolvedDate, value);
};

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
        if (data.allDay || data.isFreeDay) {
            if (!isDateOrDateTimeWithTimezone(data.start)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["start"],
                    message:
                        "Para eventos de todo el día, el inicio debe ser una fecha válida.",
                });
            }

            if (!isDateOrDateTimeWithTimezone(data.end)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["end"],
                    message:
                        "Para eventos de todo el día, el final debe ser una fecha válida.",
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

        if (data.isFreeDay) {
            start = dateOnlyToMexicoUtcStart(new Date(data.start));
            end = dateOnlyToMexicoUtcStart(new Date(data.end));

            if (!isNaN(end.getTime())) {
                end = new Date(end.getTime() + ONE_DAY_MS);
            }
        } else if (data.allDay) {
            if (DATE_ONLY_REGEX.test(data.start)) {
                start = dateOnlyToMexicoUtcStart(new Date(data.start));
                end = dateOnlyToMexicoUtcStart(new Date(data.end));

                if (!isNaN(end.getTime())) {
                    end = new Date(end.getTime() + ONE_DAY_MS);
                }
            } else {
                start = new Date(data.start);
                end = new Date(data.end);
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

        return {
            ...data,
            start,
            end,
            allDay: data.allDay || data.isFreeDay,
            localStartDate: data.start.slice(0, 10),
        };
    })
    .refine((data) => data.start < data.end, {
        message: "La fecha de inicio debe ser anterior a la fecha de fin.",
        path: ["start"],
    })
    .refine(
        (data) => data.localStartDate >= getHouseMinDateStr(),
        {
            message: `No se pueden crear eventos antes del 1 de enero de ${new Date().getFullYear()}.`,
            path: ["start"],
        },
    )
    .refine(
        (data) => data.localStartDate <= getHouseMaxDateStr(),
        {
            message: `No se pueden crear eventos más allá del año ${new Date().getFullYear() + 2}.`,
            path: ["start"],
        },
    );

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
            .regex(DATE_ONLY_REGEX, "La fecha debe tener formato YYYY-MM-DD"),

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
            .refine(
                isTimeOrDateTimeWithTimezone,
                "La hora de inicio debe tener formato HH:mm, HH:mm:ss o fecha/hora con zona horaria",
            )
            .optional(),

        end: z
            .string()
            .refine(
                isTimeOrDateTimeWithTimezone,
                "La hora de fin debe tener formato HH:mm, HH:mm:ss o fecha/hora con zona horaria",
            )
            .optional(),

        employeeIds: z
            .array(
                z.string().uuid("Los IDs de empleados deben ser UUIDs válidos"),
            )
            .optional(),

        forceOverlap: z.boolean().optional().default(false),

        trainer: z
            .string()
            .trim()
            .min(1, { message: "El nombre del instructor no puede estar vacío." })
            .max(150, { message: "El nombre del instructor no debe exceder 150 caracteres." })
            .regex(TEXT_REGEX, {
                message: "Solo se permiten letras, números, espacios y signos básicos.",
            })
            .nullable()
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (data.allDay === true) {
            if (
                data.start &&
                data.end &&
                eventEndDateTimeForValidation(data.date, data.end) <=
                    eventDateTimeToUtc(data.date, data.start)
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["end"],
                    message:
                        "La fecha/hora de fin debe ser mayor que la de inicio",
                });
            }
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

        if (
            data.start &&
            data.end &&
            eventEndDateTimeForValidation(data.date, data.end) <=
                eventDateTimeToUtc(data.date, data.start)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["end"],
                message: "La hora de fin debe ser mayor que la hora de inicio",
            });
        }
    })
    .refine((data) => data.date >= getTodayStr(), {
        message: "No se pueden crear eventos en fechas pasadas.",
        path: ["date"],
    })
    .refine((data) => data.date <= getMaxDateStr(), {
        message: "No se pueden crear eventos con más de 2 años de anticipación.",
        path: ["date"],
    });

exports.searchEmployeesSchema = z.object({
    search: z
        .string()
        .trim()
        .max(100, { message: "La búsqueda no debe exceder 100 caracteres." })
        .optional(),
});

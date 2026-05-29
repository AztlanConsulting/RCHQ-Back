const { z } = require("zod");
const { convertUTCToMexicanTime } = require("../../utils/dates");
const { normalizeTime } = require("../../utils/event/dateTime");

const TEXT_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s\-!¿¡?.,:;()]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_WITH_TIMEZONE_REGEX =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const dateOnlyToUtcDate = (value) => new Date(`${value}T06:00:00.000Z`);

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const isDateOrDateTimeWithTimezone = (value) =>
    DATE_REGEX.test(value) || DATETIME_WITH_TIMEZONE_REGEX.test(value);
const isTimeOrDateTimeWithTimezone = (value) =>
    TIME_REGEX.test(value) || DATETIME_WITH_TIMEZONE_REGEX.test(value);
const eventDateTimeForValidation = (date, value) => {
    if (DATETIME_WITH_TIMEZONE_REGEX.test(value)) return new Date(value);
    return new Date(`${date}T${normalizeTime(value)}-06:00`);
};
const eventEndDateTimeForValidation = (date, value) => {
    if (DATETIME_WITH_TIMEZONE_REGEX.test(value)) return new Date(value);
    const resolvedDate =
        String(value).slice(0, 5) === "00:00"
            ? new Date(new Date(`${date}T00:00:00.000Z`).getTime() + ONE_DAY_MS)
                  .toISOString()
                  .slice(0, 10)
            : date;
    return eventDateTimeForValidation(resolvedDate, value);
};

const getTodayStr = () => convertUTCToMexicanTime(new Date()).toISOString().slice(0, 10);
const getMaxDateStr = () => {
    const d = convertUTCToMexicanTime(new Date());
    d.setUTCFullYear(d.getUTCFullYear() + 2);
    return d.toISOString().slice(0, 10);
};
const getHouseMinDateStr = () => {
    const year = convertUTCToMexicanTime(new Date()).getUTCFullYear();
    return `${year}-01-01`;
};
const getHouseMaxDateStr = () => {
    const year = convertUTCToMexicanTime(new Date()).getUTCFullYear() + 2;
    return `${year}-12-31`;
};

exports.houseEventUpdateSchema = z
    .object({
        eventTypeId: z
            .string({ error: "El eventTypeId es obligatorio." })
            .uuid({
                message: "El identificador del tipo de evento no es válido.",
            }),

        name: z
            .string({ error: "El título es obligatorio." })
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
                        "Para eventos de todo el día, start debe tener fecha válida.",
                });
            }

            if (!isDateOrDateTimeWithTimezone(data.end)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["end"],
                    message:
                        "Para eventos de todo el día, end debe tener fecha válida.",
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
            start = dateOnlyToUtcDate(data.start.slice(0, 10));
            end = dateOnlyToUtcDate(data.end.slice(0, 10));

            if (!isNaN(end.getTime())) {
                end = new Date(end.getTime() + ONE_DAY_MS);
            }
        } else if (data.allDay) {
            if (DATE_REGEX.test(data.start)) {
                start = dateOnlyToUtcDate(data.start);
                end = dateOnlyToUtcDate(data.end);

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
            message: `No se pueden mover eventos antes del 1 de enero de ${new Date().getFullYear()}.`,
            path: ["start"],
        },
    )
    .refine(
        (data) => data.localStartDate <= getHouseMaxDateStr(),
        {
            message: `No se pueden mover eventos más allá del año ${new Date().getFullYear() + 2}.`,
            path: ["start"],
        },
    );

exports.updatePersonalEventSchema = z
    .object({
        name: z
            .string({ required_error: "El nombre es obligatorio." })
            .trim()
            .min(1, { message: "El nombre no puede estar vacío." })
            .max(70, { message: "El nombre no debe exceder 70 caracteres." })
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
                message: "La descripción no debe exceder los 250 caracteres.",
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
    })
    .superRefine((data, ctx) => {
        if (data.allDay === true) {
            if (
                data.start &&
                data.end &&
                eventEndDateTimeForValidation(data.date, data.end) <=
                    eventDateTimeForValidation(data.date, data.start)
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
                eventDateTimeForValidation(data.date, data.start)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["end"],
                message: "La hora de fin debe ser mayor que la hora de inicio",
            });
        }
    })
    .refine((data) => data.date >= getTodayStr(), {
        message: "No se pueden mover eventos a fechas pasadas.",
        path: ["date"],
    })
    .refine((data) => data.date <= getMaxDateStr(), {
        message:
            "No se pueden mover eventos con más de 2 años de anticipación.",
        path: ["date"],
    });

const { z } = require("zod");
const { isRealISODate } = require("../../utils/vacation/isoDate");

const SEARCH_ALLOWED_CHARS_REGEX = /^[\p{L}\p{M}\p{N}\s]*$/u;

const optionalDateSchema = z
    .string()
    .refine(isRealISODate, {
        message: "La fecha debe existir y tener formato YYYY-MM-DD",
    })
    .optional();

const paginationSchema = {
    page: z
        .string()
        .regex(/^\d+$/, "La página debe ser numérica")
        .optional(),
    limit: z
        .string()
        .regex(/^\d+$/, "El límite debe ser numérico")
        .optional(),
};

const searchSchema = z
    .string()
    .trim()
    .max(100, "La búsqueda no puede superar 100 caracteres")
    .regex(
        SEARCH_ALLOWED_CHARS_REGEX,
        "La búsqueda solo puede contener letras, números y espacios",
    )
    .optional();

const reviewedStatusSchema = z
    .enum(["approved", "rejected", "all"])
    .optional();

exports.getPendingVacationRequestsSchema = z.object({
    params: z.object({}).strict().optional(),
    query: z
        .object({
            ...paginationSchema,
            search: searchSchema,
            startDate: optionalDateSchema,
            endDate: optionalDateSchema,
        })
        .strict()
        .refine(
            (data) => {
                if (!data.startDate || !data.endDate) return true;
                return data.startDate <= data.endDate;
            },
            {
                message: "La fecha de inicio no puede ser posterior a la fecha de fin",
                path: ["startDate"],
            },
        ),
    body: z.object({}).strict().optional(),
});

exports.getReviewedVacationRequestsSchema = z.object({
    params: z.object({}).strict().optional(),
    query: z
        .object({
            ...paginationSchema,
            search: searchSchema,
            status: reviewedStatusSchema,
            startDate: optionalDateSchema,
            endDate: optionalDateSchema,
        })
        .strict()
        .refine(
            (data) => {
                if (!data.startDate || !data.endDate) return true;
                return data.startDate <= data.endDate;
            },
            {
                message: "La fecha de inicio no puede ser posterior a la fecha de fin",
                path: ["startDate"],
            },
        ),
    body: z.object({}).strict().optional(),
});

exports.getVacationRequestsInputSchema = z
    .object({
        actorEmployeeId: z.string().uuid("ID de actor inválido"),
        query: z
            .object({
                page: paginationSchema.page,
                limit: paginationSchema.limit,
                search: searchSchema,
                status: reviewedStatusSchema,
                startDate: optionalDateSchema,
                endDate: optionalDateSchema,
            })
            .strict()
            .refine(
                (data) => {
                    if (!data.startDate || !data.endDate) return true;
                    return data.startDate <= data.endDate;
                },
                {
                    message:
                        "La fecha de inicio no puede ser posterior a la fecha de fin",
                    path: ["startDate"],
                }
            ),
    })
    .strict();

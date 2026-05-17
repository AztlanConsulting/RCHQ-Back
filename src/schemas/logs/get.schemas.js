const { z } = require("zod");

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 50;

const coercePositiveInteger = (fieldName) =>
    z.coerce
        .number({
            error: `${fieldName} debe ser numérico`,
        })
        .int({
            message: `${fieldName} debe ser un entero`,
        });

exports.logsPaginationSchema = z.object({
    page: coercePositiveInteger("page").min(1, {
        message: "page debe ser mayor o igual a 1",
    }).default(DEFAULT_LIMIT / DEFAULT_LIMIT),
    limit: coercePositiveInteger("limit").min(1, {
        message: "limit debe ser mayor o igual a 1",
    }).max(MAX_LIMIT, {
        message: `limit no debe ser mayor a ${MAX_LIMIT}`,
    }).default(DEFAULT_LIMIT),
});

exports.logsReportSchema = z.object({
    month: coercePositiveInteger("month").min(1, {
        message: "month debe ser mayor o igual a 1",
    }).max(12, {
        message: "month no debe ser mayor a 12",
    }),
    year: coercePositiveInteger("year").min(2000, {
        message: "year debe ser mayor o igual a 2000",
    }).max(2100, {
        message: "year no debe ser mayor a 2100",
    }),
});

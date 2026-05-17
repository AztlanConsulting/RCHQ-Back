const {
    getLogsByHousePage,
    getLogsByHouseInRange,
    getAffectedEmployeesByIds,
} = require("../../model/logs/get.model");
const { getHouseById } = require("../../model/house/get.model");
const RESPONSES = require("../../utils/responses");
const {
    logsPaginationSchema,
    logsReportSchema,
} = require("../../schemas/logs/get.schemas");
const {
    extractAffectedEmployeeIds,
    buildAffectedEmployeeMap,
    mapLog,
} = require("../../utils/mappers/logs.map");
const { buildLogsPdfBuffer } = require("../../utils/logsPdf");

const buildReportRange = (month, year) => {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    return {
        startDate,
        endDate,
    };
};

const formatPeriodLabel = (month, year) => {
    return new Intl.DateTimeFormat("es-MX", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
};

exports.getLogsByHouse = async (houseId, page, limit) => {
    if (!houseId) {
        return {
            code: RESPONSES.LOGS.NOT_PROVIDED,
        };
    }

    const parsedPagination = logsPaginationSchema.safeParse({
        page,
        limit,
    });

    if (!parsedPagination.success) {
        return {
            code: RESPONSES.LOGS.INVALID_PAGINATION,
        };
    }

    const {
        page: parsedPage,
        limit: parsedLimit,
    } = parsedPagination.data;
    const skip = (parsedPage - 1) * parsedLimit;
    const { logs, totalRecords } = await getLogsByHousePage(
        houseId,
        skip,
        parsedLimit,
    );
    const affectedEmployeeIds = extractAffectedEmployeeIds(logs);
    const affectedEmployees = await getAffectedEmployeesByIds(
        affectedEmployeeIds,
    );
    const affectedEmployeeMap = buildAffectedEmployeeMap(affectedEmployees);
    const totalPages =
        totalRecords === 0 ? 0 : Math.ceil(totalRecords / parsedLimit);

    return {
        code: RESPONSES.LOGS.FOUND,
        data: {
            logs: logs.map((log) => mapLog(log, affectedEmployeeMap)),
            totalPages,
            currentPage: parsedPage,
            totalRecords,
        },
    };
};

exports.getLogsPdfByHouse = async (houseId, month, year) => {
    if (!houseId) {
        return {
            code: RESPONSES.LOGS.NOT_PROVIDED,
        };
    }

    const parsedReportDate = logsReportSchema.safeParse({
        month,
        year,
    });

    if (!parsedReportDate.success) {
        return {
            code: RESPONSES.LOGS.INVALID_REPORT_DATE,
        };
    }

    const {
        month: parsedMonth,
        year: parsedYear,
    } = parsedReportDate.data;
    const { startDate, endDate } = buildReportRange(parsedMonth, parsedYear);
    const [logs, house] = await Promise.all([
        getLogsByHouseInRange(houseId, startDate, endDate),
        getHouseById(houseId),
    ]);
    const affectedEmployeeIds = extractAffectedEmployeeIds(logs);
    const affectedEmployees = await getAffectedEmployeesByIds(
        affectedEmployeeIds,
    );
    const affectedEmployeeMap = buildAffectedEmployeeMap(affectedEmployees);
    const mappedLogs = logs.map((log) => mapLog(log, affectedEmployeeMap));
    const pdfBuffer = await buildLogsPdfBuffer({
        houseName: house?.name || "Casa sin nombre",
        logs: mappedLogs,
        generatedAt: new Date(),
        periodLabel: formatPeriodLabel(parsedMonth, parsedYear),
    });

    return {
        code: RESPONSES.LOGS.FOUND,
        data: {
            pdfBuffer,
            fileName: `reporte-logs-${houseId}-${parsedYear}-${String(parsedMonth).padStart(2, "0")}.pdf`,
        },
    };
};

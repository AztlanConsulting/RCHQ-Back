const {
    getLogsByHousePage,
    getLogsByHouse: getLogsByHouseModel,
    getAffectedEmployeesByIds,
} = require("../../model/logs/get.model");
const { getHouseById } = require("../../model/house/get.model");
const RESPONSES = require("../../utils/responses");
const { logsPaginationSchema } = require("../../schemas/logs/get.schemas");
const {
    extractAffectedEmployeeIds,
    buildAffectedEmployeeMap,
    mapLog,
} = require("../../utils/mappers/logs.map");
const { buildLogsPdfBuffer } = require("../../utils/logsPdf");

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

exports.getLogsPdfByHouse = async (houseId) => {
    if (!houseId) {
        return {
            code: RESPONSES.LOGS.NOT_PROVIDED,
        };
    }

    const [logs, house] = await Promise.all([
        getLogsByHouseModel(houseId),
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
    });

    return {
        code: RESPONSES.LOGS.PDF_CREATED,
        data: {
            pdfBuffer,
            fileName: `reporte-logs-${houseId}.pdf`,
        },
    };
};

const {
    getLogsByHousePage,
    getAffectedEmployeesByIds,
} = require("../../model/logs/get.model");
const RESPONSES = require("../../utils/responses");
const { logsPaginationSchema } = require("../../schemas/logs/get.schemas");
const {
    extractAffectedEmployeeIds,
    buildAffectedEmployeeMap,
    mapLog,
} = require("../../utils/mappers/logs.map");

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

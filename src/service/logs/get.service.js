const {
    getLogsByHousePage,
    getLogsByHouseBaseWhere,
    getLogsByHouse: getLogsByHouseModel,
    getEmployeeIdsBySearch,
    getLogActions,
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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDate = (value) => String(value || "").trim();

const isValidDate = (value) => (
    !value
    || (
        DATE_PATTERN.test(value)
        && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
    )
);

const buildLogsWhereClause = async (
    houseId,
    search,
    actionIds,
    startDate,
    endDate,
) => {
    const whereClause = getLogsByHouseBaseWhere(houseId);

    if (Array.isArray(actionIds) && actionIds.length > 0) {
        whereClause.action_id = {
            in: actionIds,
        };
    }

    if (startDate || endDate) {
        whereClause.moment = {};

        if (startDate) {
            whereClause.moment.gte = new Date(`${startDate}T00:00:00.000Z`);
        }

        if (endDate) {
            whereClause.moment.lte = new Date(`${endDate}T23:59:59.999Z`);
        }
    }

    if (search) {
        const matchedEmployeeIds = await getEmployeeIdsBySearch(houseId, search);

        whereClause.OR = [
            {
                employee_id: {
                    in: matchedEmployeeIds.length > 0 ? matchedEmployeeIds : ["00000000-0000-0000-0000-000000000000"],
                },
            },
            {
                affected: {
                    contains: search,
                    mode: "insensitive",
                },
            },
        ];
    }

    return whereClause;
};

const normalizeActionIds = (rawActionIds) => {
    if (!rawActionIds) {
        return [];
    }

    if (Array.isArray(rawActionIds)) {
        return rawActionIds
            .flatMap((value) => String(value).split(","))
            .map((value) => value.trim())
            .filter(Boolean);
    }

    return String(rawActionIds)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
};

exports.getLogsByHouse = async (
    houseId,
    page,
    limit,
    rawActionIds,
    rawSearch,
    rawStartDate,
    rawEndDate,
) => {
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
    const actionIds = normalizeActionIds(rawActionIds);
    const search = String(rawSearch || "").trim();
    const startDate = normalizeDate(rawStartDate);
    const endDate = normalizeDate(rawEndDate);

    if (
        !isValidDate(startDate)
        || !isValidDate(endDate)
        || (startDate && endDate && startDate > endDate)
    ) {
        return {
            code: RESPONSES.LOGS.INVALID_PAGINATION,
        };
    }

    const skip = (parsedPage - 1) * parsedLimit;
    const whereClause = await buildLogsWhereClause(
        houseId,
        search,
        actionIds,
        startDate,
        endDate,
    );
    const { logs, totalRecords } = await getLogsByHousePage(
        whereClause,
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

exports.getLogsActions = async () => {
    const actions = await getLogActions();

    return {
        code: RESPONSES.LOGS.ACTIONS_FOUND,
        data: actions.map((action) => ({
            actionId: action.action_id,
            description: action.description,
        })),
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

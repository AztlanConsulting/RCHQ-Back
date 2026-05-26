const {
    getLogsByHousePage,
    getLogsByHouseBaseWhere,
    getLogsByHouse: getLogsByHouseModel,
    getEmployeeIdsBySearch,
    getLogIdsByAffectedSearch,
    getLogActions,
    getAffectedEmployeesByIds,
} = require("../../model/logs/get.model");
const {
    getHouseById,
    getHousesByIds,
} = require("../../model/house/get.model");
const { getEventsByIds } = require("../../model/event/get.model");
const RESPONSES = require("../../utils/responses");
const { logsPaginationSchema } = require("../../schemas/logs/get.schemas");
const {
    extractAffectedIds,
    buildAffectedEntityMap,
    mapLog,
} = require("../../utils/mappers/logs.map");
const { buildLogsPdfBuffer } = require("../../utils/logsPdf");
const { convertUTCToMexicanTime } = require("../../utils/dates");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REPORT_YEAR_RANGE = 5;

const normalizeDate = (value) => String(value || "").trim();

const isValidDate = (value) => (
    !value
    || (
        DATE_PATTERN.test(value)
        && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
    )
);

const getLogsDateBounds = () => {
    const currentYear = new Date().getUTCFullYear();

    return {
        currentYear,
        minDate: `${currentYear - REPORT_YEAR_RANGE}-01-01`,
        maxDate: `${currentYear}-12-31`,
    };
};

const buildLogsWhereClause = async (
    houseId,
    search,
    actionIds,
    startDate,
    endDate,
    responsible,
    affected,
) => {
    const whereClause = getLogsByHouseBaseWhere(houseId);
    const andConditions = [];

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
        const [matchedEmployeeIds, matchedAffectedLogIds] = await Promise.all([
            getEmployeeIdsBySearch(houseId, search),
            getLogIdsByAffectedSearch(houseId, search),
        ]);

        andConditions.push({
            OR: [
                {
                    employee_id: {
                        in: matchedEmployeeIds.length > 0 ? matchedEmployeeIds : ["00000000-0000-0000-0000-000000000000"],
                    },
                },
                {
                    log_id: {
                        in: matchedAffectedLogIds.length > 0 ? matchedAffectedLogIds : ["00000000-0000-0000-0000-000000000000"],
                    },
                },
            ],
        });
    }

    if (responsible) {
        const matchedResponsibleIds = await getEmployeeIdsBySearch(
            houseId,
            responsible,
        );

        andConditions.push({
            employee_id: {
                in: matchedResponsibleIds.length > 0
                    ? matchedResponsibleIds
                    : ["00000000-0000-0000-0000-000000000000"],
            },
        });
    }

    if (affected) {
        const matchedAffectedLogIds = await getLogIdsByAffectedSearch(
            houseId,
            affected,
        );

        andConditions.push({
            log_id: {
                in: matchedAffectedLogIds.length > 0
                    ? matchedAffectedLogIds
                    : ["00000000-0000-0000-0000-000000000000"],
            },
        });
    }

    if (andConditions.length > 0) {
        whereClause.AND = andConditions;
    }

    return whereClause;
};

const normalizeSearch = (value) => String(value || "").trim();

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
    rawResponsible,
    rawAffected,
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
    const search = normalizeSearch(rawSearch);
    const responsible = normalizeSearch(rawResponsible);
    const affected = normalizeSearch(rawAffected);
    const startDate = normalizeDate(rawStartDate);
    const endDate = normalizeDate(rawEndDate);
    const { minDate, maxDate } = getLogsDateBounds();

    if (
        !isValidDate(startDate)
        || !isValidDate(endDate)
        || (startDate && endDate && startDate > endDate)
        || (startDate && (startDate < minDate || startDate > maxDate))
        || (endDate && (endDate < minDate || endDate > maxDate))
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
        responsible,
        affected,
    );
    const { logs, totalRecords } = await getLogsByHousePage(
        whereClause,
        skip,
        parsedLimit,
    );
    const affectedIds = extractAffectedIds(logs);
    const [affectedEmployees, affectedHouses, affectedEvents] = await Promise.all([
        getAffectedEmployeesByIds(affectedIds),
        getHousesByIds(affectedIds),
        getEventsByIds(affectedIds),
    ]);
    const affectedEntityMap = buildAffectedEntityMap(
        affectedEmployees,
        affectedHouses,
        affectedEvents,
    );
    const totalPages =
        totalRecords === 0 ? 0 : Math.ceil(totalRecords / parsedLimit);

    return {
        code: RESPONSES.LOGS.FOUND,
        data: {
            logs: logs.map((log) => mapLog(log, affectedEntityMap)),
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

exports.getLogsPdfByHouse = async (houseId, selectedYear) => {
    if (!houseId) {
        return {
            code: RESPONSES.LOGS.NOT_PROVIDED,
        };
    }

    const parsedSelectedYear = Number(selectedYear);
    const { currentYear } = getLogsDateBounds();
    const minYear = currentYear - REPORT_YEAR_RANGE;

    if (
        !Number.isInteger(parsedSelectedYear)
        || parsedSelectedYear < minYear
        || parsedSelectedYear > currentYear
    ) {
        return {
            code: RESPONSES.LOGS.INVALID_PAGINATION,
        };
    }

    const startYear = parsedSelectedYear;
    const endYear = currentYear;
    const whereClause = getLogsByHouseBaseWhere(houseId);
    whereClause.moment = {
        gte: new Date(`${startYear}-01-01T00:00:00.000Z`),
        lte: new Date(`${endYear}-12-31T23:59:59.999Z`),
    };

    const [logs, house] = await Promise.all([
        getLogsByHouseModel(whereClause),
        getHouseById(houseId),
    ]);
    const affectedIds = extractAffectedIds(logs);
    const [affectedEmployees, affectedHouses, affectedEvents] = await Promise.all([
        getAffectedEmployeesByIds(affectedIds),
        getHousesByIds(affectedIds),
        getEventsByIds(affectedIds),
    ]);
    const affectedEntityMap = buildAffectedEntityMap(
        affectedEmployees,
        affectedHouses,
        affectedEvents,
    );
    const mappedLogs = logs.map((log) => mapLog(log, affectedEntityMap));
    const pdfBuffer = await buildLogsPdfBuffer({
        houseName: house?.name || "Casa sin nombre",
        logs: mappedLogs,
        generatedAt: convertUTCToMexicanTime(new Date()),
    });

    return {
        code: RESPONSES.LOGS.PDF_CREATED,
        data: {
            pdfBuffer,
            fileName: `reporte-logs-${startYear}-${endYear}.pdf`,
        },
    };
};

const prisma = require("../../prisma");

const normalizeSearchTerm = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/z/g, "s");

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => UUID_REGEX.test(String(value || ""));

const logInclude = {
    action: {
        select: {
            description: true,
            important: true,
        },
    },
    employee: {
        select: {
            employee_id: true,
            name: true,
            surname: true,
            curp: true,
            picture: true,
            house_id: true,
        },
    },
};

exports.getLogsByHousePage = async (whereClause, skip, take) => {
    const logsWhereClause = whereClause || {};

    const [logs, totalRecords] = await prisma.$transaction([
        prisma.logs.findMany({
            where: logsWhereClause,
            include: logInclude,
            orderBy: { moment: "desc" },
            skip,
            take,
        }),
        prisma.logs.count({
            where: logsWhereClause,
        }),
    ]);

    return {
        logs,
        totalRecords,
    };
};

exports.getLogsByHouseBaseWhere = (houseId) => ({
    employee: {
        house_id: houseId,
    },
});

const getSearchTerms = (search) => String(search)
    .trim()
    .split(/\s+/)
    .map(normalizeSearchTerm)
    .filter(Boolean);

const matchesNormalizedTerms = (values, searchTerms) => {
    if (searchTerms.length === 0) {
        return true;
    }

    const normalizedValues = values.map((value) => normalizeSearchTerm(value));

    return searchTerms.every((term) =>
        normalizedValues.some((value) => value.includes(term)),
    );
};

exports.getLogIdsByAffectedSearch = async (houseId, search) => {
    if (!search) {
        return [];
    }

    const searchTerms = getSearchTerms(search);

    if (searchTerms.length === 0) {
        return [];
    }

    const logs = await prisma.logs.findMany({
        where: {
            employee: {
                house_id: houseId,
            },
        },
        select: {
            log_id: true,
            affected: true,
        },
    });

    const affectedIds = logs
        .map((log) => log.affected)
        .filter(Boolean);
    const affectedUuidIds = affectedIds.filter(isUuid);

    const [employees, houses, houseEvents, personalEvents, globalEvents] = await Promise.all([
        prisma.employee.findMany({
            where: {
                employee_id: {
                    in: affectedUuidIds,
                },
            },
            select: {
                employee_id: true,
                name: true,
                surname: true,
                curp: true,
            },
        }),
        prisma.house.findMany({
            where: {
                house_id: {
                    in: affectedUuidIds,
                },
            },
            select: {
                house_id: true,
                name: true,
            },
        }),
        prisma.house_event.findMany({
            where: {
                house_event_id: {
                    in: affectedUuidIds,
                },
            },
            select: {
                house_event_id: true,
                name: true,
            },
        }),
        prisma.personal_event.findMany({
            where: {
                personal_event_id: {
                    in: affectedUuidIds,
                },
            },
            select: {
                personal_event_id: true,
                name: true,
            },
        }),
        prisma.global_event.findMany({
            where: {
                global_event_id: {
                    in: affectedUuidIds,
                },
            },
            select: {
                global_event_id: true,
                name: true,
            },
        }),
    ]);

    const affectedMap = new Map();

    employees.forEach((employee) => {
        affectedMap.set(employee.employee_id, [
            `${employee.name || ""} ${employee.surname || ""}`,
            employee.curp || "",
        ]);
    });

    houses.forEach((house) => {
        affectedMap.set(house.house_id, [house.name || ""]);
    });

    houseEvents.forEach((event) => {
        affectedMap.set(event.house_event_id, [event.name || ""]);
    });

    personalEvents.forEach((event) => {
        affectedMap.set(event.personal_event_id, [event.name || ""]);
    });

    globalEvents.forEach((event) => {
        affectedMap.set(event.global_event_id, [event.name || ""]);
    });

    return logs
        .filter((log) => {
            const values = [
                ...(affectedMap.get(log.affected) || []),
                log.affected || "",
            ];

            return matchesNormalizedTerms(values, searchTerms);
        })
        .map((log) => log.log_id);
};

exports.getEmployeeIdsBySearch = async (houseId, search) => {
    if (!search) {
        return [];
    }

    const searchTerms = getSearchTerms(search);

    if (searchTerms.length === 0) {
        return [];
    }

    const employees = await prisma.employee.findMany({
        where: {
            house_id: houseId,
        },
        select: {
            employee_id: true,
            name: true,
            surname: true,
            curp: true,
        },
    });

    return employees
        .filter((employee) =>
            matchesNormalizedTerms(
                [
                    `${employee.name || ""} ${employee.surname || ""}`,
                    employee.curp || "",
                ],
                searchTerms,
            ),
        )
        .map((employee) => employee.employee_id);
};

exports.getLogActions = async () => {
    return prisma.action.findMany({
        select: {
            action_id: true,
            description: true,
        },
        orderBy: {
            description: "asc",
        },
    });
};

exports.getLogsByHouse = async (whereClause) => {
    return prisma.logs.findMany({
        where: whereClause,
        include: logInclude,
        orderBy: { moment: "desc" },
    });
};

exports.getAffectedEmployeesByIds = async (employeeIds) => {
    if (employeeIds.length === 0) {
        return [];
    }

    return prisma.employee.findMany({
        where: {
            employee_id: {
                in: employeeIds,
            },
        },
        select: {
            employee_id: true,
            name: true,
            surname: true,
        },
    });
};

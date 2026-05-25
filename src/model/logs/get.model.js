const prisma = require("../../prisma");

const SEARCHABLE_ACCENTED_CHARS = "áéíóúäëïöüàèìòùâêîôûñç";
const SEARCHABLE_REPLACEMENT_CHARS = "aeiouaeiouaeiouaeiounc";

const normalizeSearchTerm = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

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

exports.getEmployeeIdsBySearch = async (houseId, search) => {
    if (!search) {
        return [];
    }

    const searchTerms = String(search)
        .trim()
        .split(/\s+/)
        .map(normalizeSearchTerm)
        .filter(Boolean);

    if (searchTerms.length === 0) {
        return [];
    }

    const queryParams = [houseId];
    const searchConditions = searchTerms.map((term) => {
        const normalizedLike = `%${term}%`;
        queryParams.push(
            SEARCHABLE_ACCENTED_CHARS,
            SEARCHABLE_REPLACEMENT_CHARS,
            normalizedLike,
            SEARCHABLE_ACCENTED_CHARS,
            SEARCHABLE_REPLACEMENT_CHARS,
            normalizedLike,
        );

        const firstParamIndex = queryParams.length - 5;
        const secondParamIndex = queryParams.length - 2;

        return `(
            translate(
                lower(coalesce(name, '') || ' ' || coalesce(surname, '')),
                $${firstParamIndex},
                $${firstParamIndex + 1}
            ) LIKE $${firstParamIndex + 2}
            OR translate(
                lower(coalesce(curp, '')),
                $${secondParamIndex},
                $${secondParamIndex + 1}
            ) LIKE $${secondParamIndex + 2}
        )`;
    });

    const query = `
        SELECT employee_id
        FROM employee
        WHERE house_id::text = $1
        AND ${searchConditions.join(" AND ")}
    `;

    const employees = await prisma.$queryRawUnsafe(query, ...queryParams);

    return employees.map((employee) => employee.employee_id);
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

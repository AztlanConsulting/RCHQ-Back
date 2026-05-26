const { Prisma } = require("@prisma/client");
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

    const searchConditions = searchTerms.map((term) => {
        const normalizedLike = `%${term}%`;

        return Prisma.sql`(
            translate(
                lower(coalesce(name, '') || ' ' || coalesce(surname, '')),
                ${SEARCHABLE_ACCENTED_CHARS},
                ${SEARCHABLE_REPLACEMENT_CHARS}
            ) LIKE ${normalizedLike}
            OR translate(
                lower(coalesce(curp, '')),
                ${SEARCHABLE_ACCENTED_CHARS},
                ${SEARCHABLE_REPLACEMENT_CHARS}
            ) LIKE ${normalizedLike}
        )`;
    });

    const query = Prisma.sql`
        SELECT employee_id
        FROM employee
        WHERE house_id::text = ${houseId}
        AND ${Prisma.join(searchConditions, Prisma.sql` AND `)}
    `;

    const employees = await prisma.$queryRaw(query);

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

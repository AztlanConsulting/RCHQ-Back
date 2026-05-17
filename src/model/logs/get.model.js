const prisma = require("../../prisma");

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

    const employees = await prisma.employee.findMany({
        where: {
            house_id: houseId,
            OR: [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    surname: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ],
        },
        select: {
            employee_id: true,
        },
    });

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

exports.getLogsByHouse = async (houseId) => {

    return prisma.logs.findMany({
        where: {
            employee: {
                house_id: houseId,
            },
        },
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

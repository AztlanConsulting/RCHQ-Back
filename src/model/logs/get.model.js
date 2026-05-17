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

exports.getLogsByHousePage = async (houseId, skip, take) => {
    const whereClause = {
        employee: {
            house_id: houseId,
        },
    };

    const [logs, totalRecords] = await prisma.$transaction([
        prisma.logs.findMany({
            where: whereClause,
            include: logInclude,
            orderBy: { moment: "desc" },
            skip,
            take,
        }),
        prisma.logs.count({
            where: whereClause,
        }),
    ]);

    return {
        logs,
        totalRecords,
    };
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

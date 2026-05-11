const prisma = require("../../prisma");

exports.getVacationsInRange = async (employeeId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
        where: {
            employee_id: employeeId,
            start: {
                lte: endDate,
            },
            end: {
                gte: startDate,
            },
            status: {
                not: 2,
            },
        },
    });
};

exports.getOutsideVacations = async (employeeId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
        where: {
            employee_id: employeeId,
            start: {
                lte: startDate,
            },
            end: {
                gte: endDate,
            },
            status: {
                not: 2,
            },
        },
    });
};

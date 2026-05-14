const prisma = require("../../prisma");

exports.getAbsencesInRange = async (employeeId, startDate, endDate) => {
    return await prisma.absence.findMany({
        where: {
            employee_id: employeeId,
            start: {
                lte: endDate,
            },
            end: {
                gte: startDate,
            },
        },
        include: {
            absence_type: true,
        },
        orderBy: {
            start: "asc",
        },
    });
};
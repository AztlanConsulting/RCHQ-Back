const prisma = require("../../prisma");

exports.getAllAbsenceTypes = async () => {
    return await prisma.absence_type.findMany({
        select: {
            absence_type_id: true,
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    });
};

exports.getHouseCalendarAbsenceInRange = async (houseId, startDate, endDate) => {
    return await prisma.absence.findMany({
        where: {
            start: {
                lte: endDate,
            },
            end: {
                gte: startDate,
            },
            employee: {
                house_id: houseId,
            },
        },
        include: {
            absence_type: {
                select: {
                    name: true,
                },
            },
            employee: {
                select: {
                    employee_id: true,
                    name: true,
                    surname: true,
                    curp: true,
                    employee_workday: {
                        include: {
                            workday: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            start: "asc",
        },
    });
}
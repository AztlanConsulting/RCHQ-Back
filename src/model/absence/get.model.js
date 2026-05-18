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

exports.getAbsenceTypeById = async (absenceTypeId) => {
    return await prisma.absence_type.findUnique({
        where: {
            absence_type_id: absenceTypeId,
        },
        select: {
            absence_type_id: true,
            name: true,
        },
    });
};

exports.getAbsenceById = async (absenceId) => {
    return await prisma.absence.findUnique({
        where: {
            absence_id: absenceId,
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
                    house_id: true,
                    name: true,
                    surname: true,
                    curp: true,
                },
            },
        },
    });
};

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

exports.getHouseCalendarAbsenceInRange = async (
    houseId,
    startDate,
    endDate,
) => {
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
};

exports.getHouseAbsencesInRange = async (houseId, startDate, endDate) => {
    return await prisma.absence.findMany({
        where: {
            is_deleted: false,
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
        select: {
            start: true,
            end: true,
        },
    });
};

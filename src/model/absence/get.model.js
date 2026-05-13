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

const prisma = require("../../prisma");

exports.softDeleteAbsenceById = async (absenceId) => {
    return await prisma.absence.update({
        where: {
            absence_id: absenceId,
        },
        data: {
            is_deleted: true,
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

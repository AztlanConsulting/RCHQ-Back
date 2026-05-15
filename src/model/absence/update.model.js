const prisma = require("../../prisma");

exports.updateAbsenceById = async (absenceId, data) => {
    return await prisma.absence.update({
        where: {
            absence_id: absenceId,
        },
        data,
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

const prisma = require("../../prisma");

exports.softDeleteAbsenceById = async (absenceId) => {
    const whereClause = {
        absence_id: absenceId,
    };
    const updateData = {
        is_deleted: true,
    };
    const includeRelations = {
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
    };

    return await prisma.absence.update({
        where: whereClause,
        data: updateData,
        include: includeRelations,
    });
};

const prisma = require("../../prisma");

exports.getAllAbsences = async (page, limit) => {
    const offset = (page - 1) * limit;

    const where = { is_deleted: false };

    const select = {
        absence_id: true,
        start: true,
        end: true,
        url: true,
        absence_type: {
            select: { name: true },
        },
        employee: {
            select: {
                name: true,
                picture: true,
                house: { select: { name: true } },
            },
        },
    };

    try {
        const [absences, total] = await prisma.$transaction([
            prisma.absence.findMany({
                where,
                select,
                skip: offset,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.absence.count({ where }),
        ]);

        return {
            data: absences,
            pagination: {
                total,
                page,
                limit,
            },
        };
    } catch (error) {
        console.log("Error obteniendo las ausencias: ", error);
        return { success: false, type: "Error interno del servidor" };
    }
};
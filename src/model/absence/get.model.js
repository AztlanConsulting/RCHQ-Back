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

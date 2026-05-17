const { randomUUID } = require("crypto");
const prisma = require("../../prisma");

exports.createAbsence = async (data) => {
    return await prisma.absence.create({
        data: {
            absence_id: randomUUID(),
            ...data,
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

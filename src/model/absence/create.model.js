const { randomUUID } = require("crypto");
const prisma = require("../../prisma");

exports.createAbsence = async ({
    employeeId,
    absenceTypeId,
    start,
    end,
    description,
    url,
    isDeleted = false,
}) => {
    return await prisma.absence.create({
        data: {
            absence_id: randomUUID(),
            employee_id: employeeId,
            absence_type_id: absenceTypeId,
            start,
            end,
            description: description,
            url,
            is_deleted: isDeleted,
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

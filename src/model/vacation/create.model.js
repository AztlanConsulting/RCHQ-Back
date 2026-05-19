const prisma = require("../../prisma");
const { VACATION_STATUS, ACTIVE_VACATION_STATUSES } = require("../../utils/vacationStatus");

function getUtcNow() {
    const now = new Date();
    return new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
    ));
}

exports.requestVacation = async (vacationId, employeeId, startDate, endDate, usedDays) => {
    return await prisma.vacations_request.create({
        data: {
            vacations_request_id: vacationId,
            employee_id: employeeId,
            start: startDate,
            end: endDate,
            status: VACATION_STATUS.PENDING,
            used_days: usedDays,
            created_at: getUtcNow()
        }
    })
}

exports.registerVacation = async (vacationId, employeeId, startDate, endDate, usedDays) => {
    return await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
            SELECT employee_id
            FROM employee
            WHERE employee_id = ${employeeId}::uuid
            FOR UPDATE
        `;

        const overlappingVacation = await tx.vacations_request.findFirst({
            where: {
                employee_id: employeeId,
                status: {
                    in: ACTIVE_VACATION_STATUSES,
                },
                start: {
                    lte: endDate,
                },
                end: {
                    gte: startDate,
                },
            },
        });

        if (overlappingVacation) {
            return null;
        }

        return await tx.vacations_request.create({
            data: {
                vacations_request_id: vacationId,
                employee_id: employeeId,
                start: startDate,
                end: endDate,
                status: VACATION_STATUS.APPROVED,
                used_days: usedDays,
                created_at: getUtcNow(),
            },
        });
    });
};

const prisma = require("../../prisma");
const { VACATION_STATUS } = require("../../utils/vacationStatus");

exports.createVacationRequest = async ({
    vacationId,
    employeeId,
    startDate,
    endDate,
    status,
    usedDays,
}) => {
    return await prisma.vacations_request.create({
        data: {
            vacations_request_id: vacationId,
            employee_id: employeeId,
            start: startDate,
            end: endDate,
            status,
            used_days: usedDays,
            created_at: new Date(),
        },
    });
};

exports.requestVacation = async (
    vacationId,
    employeeId,
    startDate,
    endDate,
    usedDays
) => {
    return await exports.createVacationRequest({
        vacationId,
        employeeId,
        startDate,
        endDate,
        status: VACATION_STATUS.PENDING,
        usedDays,
    });
};

exports.registerVacation = async (
    vacationId,
    employeeId,
    startDate,
    endDate,
    usedDays
) => {
    return await exports.createVacationRequest({
        vacationId,
        employeeId,
        startDate,
        endDate,
        status: VACATION_STATUS.APPROVED,
        usedDays,
    });
};
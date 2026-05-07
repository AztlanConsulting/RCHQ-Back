const prisma = require("../../prisma");

exports.requestVacation = async(vacationId, employeeId, startDate, endDate, usedDays) => {
    return await prisma.vacations_request.create({
        data: {
            vacations_request_id: vacationId,
            employee_id: employeeId,
            start: startDate,
            end: endDate,
            status: 0,
            used_days: usedDays,
            created_at: new Date()
        }
    })
}
const prisma = require("../../prisma");

exports.requestVacation = async(employeeId, startDate, endDate) => {
    return await prisma.vacations_request.create({
        data: {
            employee_id: employeeId,
            start: startDate,
            end: endDate,
            status: 0,
            created_at: new Date()
        }
    })
}
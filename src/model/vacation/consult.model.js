const prisma = require("../../prisma");
const { ACTIVE_VACATION_STATUSES } = require("../../utils/vacationStatus");

exports.getVacationsInRange = async (employeeId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
        where: {
            employee_id: employeeId,
            start: {
                lte: endDate
            },
            end: {
                gte: startDate
            }
        }
    })
}

exports.getOutsideVacations = async (employeeId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
        where: {
            employee_id: employeeId,
            start: {
                lte: startDate
            },
            end: {
                gte: endDate
            }
        }
    })
}

// Busca vacaciones traslapadas y filtra por estado
exports.getActiveVacationsInRange = async (employeeId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
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
};

// Calcula días ya comprometidos en el año laboral
exports.getCommittedVacationsInRange = async (employeeId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
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
};
const { 
    getStartDate, 
    getWorkDays
} = require("../../model/employee/consult.model");
const { 
    toUTC, 
    calculateUsedDays
} = require("../../utils/dates");
const { getVacationsInRange } = require("../../model/vacation/consult.model")
const { getVacationDays } = require("../../utils/vacationDays")
const responses = require("../../utils/responses");
const { employee } = require("../../prisma");

exports.getRemainingVacations = async (employeeId) => {
    const result = await getStartDate(employeeId);

    if (!result) {
        return {
            code: responses.vacation.workDaysNotFound
        }
    }
    
    const baseDate = result.start_date;
    const baseDay = baseDate.getUTCDate();
    const baseMonth = baseDate.getUTCMonth();
    const baseYear = baseDate.getUTCFullYear();

    const currentDate = new Date();
    const currentDay = currentDate.getUTCDate();
    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();
    
    let anniversaryAlreadyPassed = false;
    
    if ((currentMonth == baseMonth && currentDay >= baseDay) || currentMonth > baseMonth) {
        anniversaryAlreadyPassed = true;
    }
    
    let startYear = currentDate.getUTCFullYear();
    let endYear = startYear + 1;
    
    const startDate = new Date(Date.UTC(startYear, baseMonth, baseDay));
    const endDate = new Date(Date.UTC(endYear, baseMonth, baseDay));

    let usedDays = 0;
    const vacations = await getVacationsInRange(employeeId, startDate, endDate);

    vacations.forEach(vacation => {
        usedDays += vacation.used_days;
    });

    const yearsWorked = currentYear - baseYear - (!anniversaryAlreadyPassed ? 1 : 0);
    const maxDays = getVacationDays(yearsWorked);
    
    return {
        code: responses.vacation.workDaysFound,
        data: {
            remainingDays: maxDays - usedDays
        }
    }
}

exports.requestVacation = async (employeeId, startDate, endDate) => {
    if (endDate < startDate) {
        return {
            code: responses.vacation.badDates
        }
    }

    const workDays = await getWorkDays(employeeId);
    if (workDays.length == 0) {
        return {
            code: responses.vacation.withoutDates
        }
    }

    const remainingVacationResult = await this.getRemainingVacations(employeeId);
    const remaningVacations = remainingVacationResult.data.remainingDays;

    const usedDays = calculateUsedDays(workDays, startDate, endDate);

    if (usedDays > remainingVacations) {
        return {
            code: responses.vacation.insufficientDays
        }
    }

    const vacationsInsideRequest = await getVacationsInRange(employeeId, startDate, endDate);
    if (vacationsInsideRequest.length > 0) {
        return {
            code: responses.vacation.alreadyRequest
        }
    }

    // Verificafr que no haya fuera de rango

    // POST

}
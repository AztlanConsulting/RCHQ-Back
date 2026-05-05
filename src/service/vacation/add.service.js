const { 
    getStartDate, 
    getWorkDays,
} = require("../../model/employee/consult.model");
const { 
    calculateUsedDays
} = require("../../utils/dates");
const { 
    getVacationsInRange, 
    getOutsideVacations 
} = require("../../model/vacation/consult.model")
const { 
    getGlobalEventsInRange, 
} = require("../../model/event/getRanged.model")
const { getVacationDays } = require("../../utils/vacationDays")
const { LOG_ACTIONS } = require("../../utils/logActions");
const { createLog } = require("../../model/log.model")
const { requestVacation } = require("../../model/vacation/add.model")
const responses = require("../../utils/responses");
const { v4: uuidv4 } = require("uuid");

exports.getRemainingVacations = async (employeeId) => {
    const result = await getStartDate(employeeId);

    // !ERROR: El código de respuesta está mal
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
    
    let startYear = anniversaryAlreadyPassed ? currentDate.getUTCFullYear() : currentDate.getUTCFullYear() - 1;
    let endYear = startYear + 1;
    
    const startDate = new Date(Date.UTC(startYear, baseMonth, baseDay));
    const endDate = new Date(Date.UTC(endYear, baseMonth, baseDay));

    let usedDays = 0;

    // !ERROR: Si una vacación está en 2 ciclos al mismo tiempo, los días se van a contar mal
    const vacations = await getVacationsInRange(employeeId, startDate, endDate);

    // ERROR??? Se puede hacer el SUM directo desde prisma?
    vacations.forEach(vacation => {
        usedDays += vacation.used_days;
    });

    const yearsWorked = currentYear - baseYear - (!anniversaryAlreadyPassed ? 1 : 0);
    const maxDays = getVacationDays(yearsWorked);
    
    return {
        code: responses.vacation.workDaysFound,
        data: {
            remainingDays: maxDays - usedDays,
            startDate: startDate,
            endDate: endDate
        }
    }
}

exports.requestVacation = async (employeeId, startDate, endDate, ipAddress) => {

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
    const remainingVacations = remainingVacationResult.data.remainingDays;
    
    // ? QUESTION: Se pueden pedir vacaciones del próximo ciclo?
    const today = new Date();
    const anniversaryStartDate = remainingVacationResult.data.startDate;
    const anniversaryEndDate = remainingVacationResult.data.endDate;
    
    if (today > anniversaryEndDate || today < anniversaryStartDate) {
        return {
            code: responses.vacation.outOfRange
        }
    }

    const globalEvents = await getGlobalEventsInRange(startDate, endDate);

    const usedDays = calculateUsedDays(workDays, startDate, endDate, globalEvents);

    if (usedDays == 0) {
        return {
            code: responses.vacation.nullDates
        }
    }

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

    const vacationsOutsideRequest = await getOutsideVacations(employeeId, startDate, endDate);
    if (vacationsOutsideRequest.length > 0) {
        return {
            code: responses.vacation.alreadyRequest
        }
    }

    await requestVacation(
        uuidv4(), 
        employeeId, 
        startDate, 
        endDate,
        usedDays
    );

    await createLog(
        employeeId,
        LOG_ACTIONS.VACATION_REQUESTED_SUCCESS,
        ipAddress,
        employeeId
    );

    return {
        code: responses.vacation.requested
    }
}
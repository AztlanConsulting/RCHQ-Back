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
const RESPONSES = require("../../utils/responses");
const { randomUUID } = require("crypto");

exports.getRemainingVacations = async (employeeId) => {
    const result = await getStartDate(employeeId);

    if (!result) {
        return {
            code: RESPONSES.VACATION.WITHOUT_START_DATE
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
    const endDate = new Date(Date.UTC(endYear, baseMonth, baseDay - 1));

    let usedDays = 0;

    const vacations = await getVacationsInRange(employeeId, startDate, endDate);

    vacations.forEach(vacation => {
        usedDays += vacation.used_days;
    });

    const yearsWorked = currentYear - baseYear - (!anniversaryAlreadyPassed ? 1 : 0);
    const maxDays = getVacationDays(yearsWorked);
    
    return {
        code: RESPONSES.VACATION.REMAINING_VACATIONS_FOUND,
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
            code: RESPONSES.VACATION.BAD_DATES
        }
    }

    const workDays = await getWorkDays(employeeId);
    if (workDays.length == 0) {
        return {
            code: RESPONSES.VACATION.WITHOUT_DATES
        }
    }

    const remainingVacationResult = await this.getRemainingVacations(employeeId);
    const remainingVacations = remainingVacationResult.data.remainingDays;
    
    const today = new Date();
    const anniversaryStartDate = remainingVacationResult.data.startDate;
    const anniversaryEndDate = remainingVacationResult.data.endDate;
    
    if (endDate > anniversaryEndDate || startDate < anniversaryStartDate) {
        return {
            code: RESPONSES.VACATION.OUT_OF_RANGE
        }
    }

    if (startDate < today) {
        return {
            code: RESPONSES.VACATION.PAST_REQUEST_NOT_ALLOWED
        }
    }

    const globalEvents = await getGlobalEventsInRange(startDate, endDate);

    const usedDays = calculateUsedDays(workDays, startDate, endDate, globalEvents);

    if (usedDays == 0) {
        return {
            code: RESPONSES.VACATION.NULL_DATES
        }
    }

    if (usedDays > remainingVacations) {
        return {
            code: RESPONSES.VACATION.INSUFFICIENT_DATES
        }
    }

    const vacationsInsideRequest = await getVacationsInRange(employeeId, startDate, endDate);
    if (vacationsInsideRequest.length > 0) {
        return {
            code: RESPONSES.VACATION.ALREADY_REQUEST
        }
    }

    const vacationsOutsideRequest = await getOutsideVacations(employeeId, startDate, endDate);
    if (vacationsOutsideRequest.length > 0) {
        return {
            code: RESPONSES.VACATION.ALREADY_REQUEST
        }
    }

    await requestVacation(
        randomUUID(),
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
        code: RESPONSES.VACATION.REQUESTED
    }
}
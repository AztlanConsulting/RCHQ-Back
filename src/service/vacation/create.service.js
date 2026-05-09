const { getWorkDays } = require("../../model/employee/get.model");
const { 
    calculateUsedDays,
    stringToDate,
} = require("../../utils/dates");
const { 
    getVacationsInRange, 
    getOutsideVacations 
} = require("../../model/vacation/get.model");
const { 
    getGlobalEventsInRange, 
} = require("../../model/event/get.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { dateRangeSchema } = require("../../schemas/dates.schemas");
const { createLog } = require("../../model/log.model");
const { requestVacation } = require("../../model/vacation/create.model");
const { getRemainingVacations } = require("./get.service");
const RESPONSES = require("../../utils/responses");
const { randomUUID } = require("crypto");

exports.requestVacation = async (employeeId, rawStartDate, rawEndDate, ipAddress) => {
    const validation = dateRangeSchema.safeParse({startDate: rawStartDate, endDate: rawEndDate});

    if (!validation.success) {
        return {
            code: RESPONSES.DATES.WRONG_FORMAT
        };
    }

    let startDate = stringToDate(rawStartDate);
    let endDate = stringToDate(rawEndDate);

    if (endDate < startDate) {
        return {
            code: RESPONSES.DATES.BAD_DATES
        }
    }

    const workDays = await getWorkDays(employeeId);
    if (workDays.length == 0) {
        return {
            code: RESPONSES.VACATION.WITHOUT_DATES
        }
    }

    const remainingVacationResult = await getRemainingVacations(employeeId);
    const remainingVacations = remainingVacationResult.data.remainingDays;
    
    const now = new Date();
    const todayUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    ));
    const anniversaryStartDate = remainingVacationResult.data.startDate;
    const anniversaryEndDate = remainingVacationResult.data.endDate;
    
    if (endDate > anniversaryEndDate || startDate < anniversaryStartDate) {
        return {
            code: RESPONSES.VACATION.OUT_OF_RANGE
        }
    }

    if (startDate <= todayUTC) {
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
const {
    getWorkDays,
    findByIdWithRoleAndHouse,
} = require("../../model/employee/get.model");
const { 
    calculateUsedDays,
    stringToDate,
    convertUTCToMexicanTime,
} = require("../../utils/dates");
const { 
    getVacationsInRange, 
    getOutsideVacations ,
    getActiveVacationsInRange,
} = require("../../model/vacation/get.model");
const { 
    getGlobalEventsInRange, 
    getHouseEventsInRange,
} = require("../../model/event/get.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { dateRangeSchema } = require("../../schemas/dates.schemas");
const { createLog } = require("../../model/log.model");
const {
    requestVacation,
    registerVacation,
} = require("../../model/vacation/create.model");
const { getRemainingVacations } = require("./get.service");
const RESPONSES = require("../../utils/responses");
const { randomUUID } = require("crypto");

function getTodayUTC() {
    const now = new Date();
    return new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    ));
}

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

exports.registerEmployeeVacation = async ({
    actorEmployeeId,
    targetEmployeeId,
    rawStartDate,
    rawEndDate,
    ipAddress,
    requesterHouseId,
}) => {
    const validation = dateRangeSchema.safeParse({
        startDate: rawStartDate,
        endDate: rawEndDate,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.DATES.WRONG_FORMAT,
        };
    }

    if (!actorEmployeeId) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    if (!targetEmployeeId) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_PROVIDED,
        };
    }

    const startDate = stringToDate(rawStartDate);
    const endDate = stringToDate(rawEndDate);
    const searchEndDate = new Date(endDate);
    searchEndDate.setUTCDate(searchEndDate.getUTCDate() + 1);

    console.log(startDate, endDate);

    if (endDate < startDate) {
        return {
            code: RESPONSES.DATES.BAD_DATES,
        };
    }

    const today = getTodayUTC();

    if (startDate < today) {
        return {
            code: RESPONSES.VACATION.PAST_REGISTER_NOT_ALLOWED,
        };
    }

    const targetEmployee = await findByIdWithRoleAndHouse(targetEmployeeId);

    if (!targetEmployee) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const workDays = await getWorkDays(targetEmployeeId);

    if (workDays.length === 0) {
        return {
            code: RESPONSES.VACATION.WITHOUT_DATES,
        };
    }

    const remainingVacationResult = await getRemainingVacations(targetEmployeeId);
    const remainingVacations = remainingVacationResult.data.remainingDays;
    const anniversaryStartDate = remainingVacationResult.data.startDate;
    const anniversaryEndDate = remainingVacationResult.data.endDate;

    if (endDate > anniversaryEndDate || startDate < anniversaryStartDate) {
        return {
            code: RESPONSES.VACATION.OUT_OF_RANGE,
        };
    }

    const globalEvents = await getGlobalEventsInRange(startDate, searchEndDate);
    const houseEvents = await getHouseEventsInRange(requesterHouseId, startDate, searchEndDate);

    const freeDays = [...houseEvents, ...globalEvents]
        .filter((event) => event.isFreeDay === true)
        .map((event) => ({
            ...event,
            start: convertUTCToMexicanTime(event.start),
            end: convertUTCToMexicanTime(event.end),
        }));

    const usedDays = calculateUsedDays(workDays, startDate, endDate, freeDays, true);

    if (usedDays <= 0) {
        return {
            code: RESPONSES.VACATION.NULL_DATES,
        };
    }

    if (usedDays > remainingVacations) {
        return {
            code: RESPONSES.VACATION.INSUFFICIENT_DATES,
        };
    }

    const overlappingVacations = await getActiveVacationsInRange(
        targetEmployeeId,
        startDate,
        endDate
    );

    if (overlappingVacations.length > 0) {
        return {
            code: RESPONSES.VACATION.ALREADY_REQUEST,
        };
    }

    const vacationRequest = await registerVacation(
        randomUUID(),
        targetEmployeeId,
        startDate,
        endDate,
        usedDays
    );

    if (!vacationRequest) {
        return {
            code: RESPONSES.VACATION.ALREADY_REQUEST,
        };
    }

    await createLog(
        actorEmployeeId,
        LOG_ACTIONS.VACATION_REGISTERED_SUCCESS,
        ipAddress,
        targetEmployeeId
    );

    return {
        code: RESPONSES.VACATION.REGISTERED,
        data: {
            vacationRequest,
        },
    };
};
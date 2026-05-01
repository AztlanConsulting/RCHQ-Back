const { 
    getStartDate, 
    getWorkDays,
    findByIdWithRoleAndHouse,
} = require("../../model/employee/consult.model");
const { 
    toUTC, 
    calculateUsedDays
} = require("../../utils/dates");
const { 
    getVacationsInRange, 
    getOutsideVacations,
    getActiveVacationsInRange,
    getCommittedVacationsInRange,
} = require("../../model/vacation/consult.model")
const { getVacationDays } = require("../../utils/vacationDays")
const { getCurrentWorkYearRange } = require("../../utils/vacationYear");
const { getClientIp } = require("../../utils/ip");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { createLog } = require("../../model/log.model")
const { requestVacation, registerVacation } = require("../../model/vacation/add.model")
const responses = require("../../utils/responses");
const { v4: uuidv4 } = require("uuid");

const ADMIN_ROLE = "admin";
const COORDINATOR_ROLE = "coordinador";

function isAdmin(roleName) {
    return roleName?.toLowerCase() === ADMIN_ROLE;
}

function isCoordinator(roleName) {
    return roleName?.toLowerCase() === COORDINATOR_ROLE;
}

function isAdminOrCoordinator(roleName) {
    return isAdmin(roleName) || isCoordinator(roleName);
}

function isValidDateObject(date) {
    return date instanceof Date && !Number.isNaN(date.getTime());
}

function getTodayUTC() {
    const now = new Date();
    return new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    ));
}

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

exports.requestVacation = async (employeeId, startDate, endDate, req) => {
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
        getClientIp(req),
        employeeId
    );

    return {
        code: responses.vacation.requested
    }
}

exports.registerEmployeeVacation = async ({
    actorEmployeeId,
    targetEmployeeId,
    startDate,
    endDate,
    ipAddress,
}) => {
    if (!actorEmployeeId) {
        return {
            code: responses.vacation.userNotAuthenticated,
        };
    }

    if (!targetEmployeeId) {
        return {
            code: responses.vacation.employeeNotFound,
        };
    }

    const actorEmployee = await findByIdWithRoleAndHouse(actorEmployeeId);

    if (!actorEmployee) {
        return {
            code: responses.vacation.userNotAuthenticated,
        };
    }

    const actorRoleName = actorEmployee.role?.name;

    if (!isAdminOrCoordinator(actorRoleName)) {
        return {
            code: responses.vacation.insufficientPermissions,
        };
    }

    const targetEmployee = await findByIdWithRoleAndHouse(targetEmployeeId);

    if (!targetEmployee) {
        return {
            code: responses.vacation.employeeNotFound,
        };
    }

    if (
        isCoordinator(actorRoleName) &&
        actorEmployee.house_id !== targetEmployee.house_id
    ) {
        return {
            code: responses.vacation.employeeOutOfScope,
        };
    }

    if (!isValidDateObject(startDate) || !isValidDateObject(endDate)) {
        return {
            code: responses.vacation.invalidDates,
        };
    }

    const today = getTodayUTC();

    if (startDate < today) {
        return {
            code: responses.vacation.pastDateNotAllowed,
        };
    }

    if (endDate < startDate) {
        return {
            code: responses.vacation.badDates,
        };
    }

    const workDays = await getWorkDays(targetEmployeeId);

    if (workDays.length === 0) {
        return {
            code: responses.vacation.withoutDates,
        };
    }

    const usedDays = calculateUsedDays(workDays, startDate, endDate);

    if (usedDays === 0) {
        return {
            code: responses.vacation.noWorkDaysInRange,
        };
    }

    const overlappingVacations = await getActiveVacationsInRange(
        targetEmployeeId,
        startDate,
        endDate
    );

    if (overlappingVacations.length > 0) {
        return {
            code: responses.vacation.alreadyRequest,
        };
    }

    const startDateResult = await getStartDate(targetEmployeeId);

    if (!startDateResult) {
        return {
            code: responses.vacation.employeeNotFound,
        };
    }

    const { workYearStart, workYearEnd } = getCurrentWorkYearRange(
        startDateResult.start_date
    );

    if (startDate < workYearStart || endDate >= workYearEnd) {
        return {
            code: responses.vacation.outsideCurrentWorkYear,
        };
    }

    const committedVacations = await getCommittedVacationsInRange(
        targetEmployeeId,
        workYearStart,
        workYearEnd
    );

    const committedDays = committedVacations.reduce(
        (total, vacation) => total + vacation.used_days,
        0
    );

    const employeeStartDate = startDateResult.start_date;
    const yearsWorked = workYearStart.getUTCFullYear() - employeeStartDate.getUTCFullYear();
    const maxDays = getVacationDays(yearsWorked);
    const remainingDays = maxDays - committedDays;

    if (usedDays > remainingDays) {
        return {
            code: responses.vacation.insufficientDays,
        };
    }

    const vacationRequest = await registerVacation(
        uuidv4(),
        targetEmployeeId,
        startDate,
        endDate,
        usedDays
    );

    await createLog(
        actorEmployeeId,
        LOG_ACTIONS.VACATION_REGISTERED_SUCCESS,
        ipAddress,
        targetEmployeeId
    );

    return {
        code: responses.vacation.registered,
        data: {
            vacationRequest,
        },
    };
};
const {
    findByIdWithRoleAndHouse,
    getWorkDays,
} = require("../../model/employee/get.model");
const {
    getVacationRequestById,
} = require("../../model/vacation/get.model");
const {
    getGlobalEventsInRange,
    getHouseEventsInRange,
} = require("../../model/event/get.model");
const {
    approveVacationRequestAtomically,
    rejectVacationRequestAtomically,
    updateVacationRequestDatesAtomically,
} = require("../../model/vacation/update.model");
const {
    calculateUsedDays,
    stringToDate,
    convertUTCToMexicanTime,
    hasDateStartedInMexico,
} = require("../../utils/dates");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const { ROLES } = require("../../utils/roles");
const { VACATION_STATUS } = require("../../utils/vacationStatus");
const {
    approveVacationRequestInputSchema,
    rejectVacationRequestInputSchema,
    updateVacationRequestDatesInputSchema,
} = require("../../schemas/vacation/update.schemas");
const { getVacationYearInfoForApproval } = require("./get.service");

const isAdminRole = (roleName) =>
    roleName?.toLowerCase() === ROLES.ADMIN.toLowerCase();

const isCoordinatorRole = (roleName) =>
    roleName === ROLES.COORDINATOR;

exports.approveVacationRequest = async ({
    actorEmployeeId,
    requesterHouseId,
    vacationRequestId,
    ipAddress,
}) => {
    const validation = approveVacationRequestInputSchema.safeParse({
        actorEmployeeId,
        vacationRequestId,
        ipAddress,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.VACATION.VALIDATION_ERROR,
        };
    }

    const actorEmployee = await findByIdWithRoleAndHouse(actorEmployeeId);

    if (!actorEmployee) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const actorRoleName = actorEmployee.role?.name;

    if (actorRoleName !== ROLES.COORDINATOR) {
        return {
            code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
        };
    }

    const vacationRequest = await getVacationRequestById(vacationRequestId);

    if (!vacationRequest) {
        return {
            code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
        };
    }

    if (vacationRequest.status !== VACATION_STATUS.PENDING) {
        return {
            code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
        };
    }

    const targetEmployeeId = vacationRequest.employee_id;

    const targetEmployee = await findByIdWithRoleAndHouse(targetEmployeeId);

    if (!targetEmployee) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    if (isAdminRole(targetEmployee.role?.name)) {
        return {
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        };
    }

    if (actorEmployee.house_id !== targetEmployee.house_id) {
        return {
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        };
    }

    const vacationYearResult =
        await getVacationYearInfoForApproval(targetEmployeeId);

    if (!vacationYearResult.data) {
        return {
            code: vacationYearResult.code,
        };
    }

    const anniversaryStartDate = vacationYearResult.data.startDate;
    const anniversaryEndDate = vacationYearResult.data.endDate;
    const maxDays = vacationYearResult.data.maxDays;

    if (
        vacationRequest.end > anniversaryEndDate ||
        vacationRequest.start < anniversaryStartDate
    ) {
        return {
            code: RESPONSES.VACATION.OUT_OF_RANGE,
        };
    }

    const workDays = await getWorkDays(targetEmployeeId);

    if (workDays.length === 0) {
        return {
            code: RESPONSES.VACATION.WITHOUT_DATES,
        };
    }

    const startDate = vacationRequest.start;
    const endDate = vacationRequest.end;
    const searchEndDate = new Date(endDate);
    searchEndDate.setUTCDate(searchEndDate.getUTCDate() + 1);

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

    if (usedDays === 0) {
        return {
            code: RESPONSES.VACATION.NULL_DATES,
        };
    }

    const approvalResult = await approveVacationRequestAtomically({
        vacationRequestId,
        employeeId: targetEmployeeId,
        actorHouseId: actorEmployee.house_id,
        usedDays,
        anniversaryStartDate,
        anniversaryEndDate,
        maxDays,
    });

    if (!approvalResult.success) {
        return {
            code: approvalResult.code,
        };
    }

    try {
        await createLog(
            actorEmployeeId,
            LOG_ACTIONS.VACATION_APPROVED_SUCCESS,
            ipAddress,
            targetEmployeeId
        );
    } catch (error) {
        console.error("Error creando log de aprobación de vacaciones:", error);
    }

    return {
        code: RESPONSES.VACATION.APPROVED,
        data: {
            vacationRequest: approvalResult.data.vacationRequest,
        },
    };
};

exports.rejectVacationRequest = async ({
    actorEmployeeId,
    vacationRequestId,
    feedback,
    ipAddress,
}) => {
    const validation = rejectVacationRequestInputSchema.safeParse({
        actorEmployeeId,
        vacationRequestId,
        feedback,
        ipAddress,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.VACATION.VALIDATION_ERROR,
        };
    }

    const actorEmployee = await findByIdWithRoleAndHouse(actorEmployeeId);

    if (!actorEmployee) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const actorRoleName = actorEmployee.role?.name;

    if (actorRoleName !== ROLES.COORDINATOR) {
        return {
            code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
        };
    }

    const vacationRequest = await getVacationRequestById(vacationRequestId);

    if (!vacationRequest) {
        return {
            code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
        };
    }

    if (vacationRequest.status !== VACATION_STATUS.PENDING) {
        return {
            code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
        };
    }

    const targetEmployeeId = vacationRequest.employee_id;

    const targetEmployee = await findByIdWithRoleAndHouse(targetEmployeeId);

    if (!targetEmployee) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    if (isAdminRole(targetEmployee.role?.name)) {
        return {
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        };
    }

    if (actorEmployee.house_id !== targetEmployee.house_id) {
        return {
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        };
    }

    const rejectionResult = await rejectVacationRequestAtomically({
        vacationRequestId,
        employeeId: targetEmployeeId,
        actorHouseId: actorEmployee.house_id,
        feedback: validation.data.feedback,
    });

    if (!rejectionResult.success) {
        return {
            code: rejectionResult.code,
        };
    }

    try {
        await createLog(
            actorEmployeeId,
            LOG_ACTIONS.VACATION_REJECTED_SUCCESS,
            ipAddress,
            targetEmployeeId
        );
    } catch (error) {
        console.error("Error creando log de rechazo de vacaciones:", error);
    }

    return {
        code: RESPONSES.VACATION.REJECTED,
        data: {
            vacationRequest: rejectionResult.data.vacationRequest,
        },
    };
};

exports.updateVacationRequestDates = async ({
    actorEmployeeId,
    vacationRequestId,
    rawStartDate,
    rawEndDate,
    ipAddress,
    requesterHouseId,
}) => {
    const validation = updateVacationRequestDatesInputSchema.safeParse({
        actorEmployeeId,
        vacationRequestId,
        rawStartDate,
        rawEndDate,
        ipAddress,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.VACATION.VALIDATION_ERROR,
        };
    }

    const actorEmployee = await findByIdWithRoleAndHouse(actorEmployeeId);

    if (!actorEmployee) {
        return {
            code: RESPONSES.USER.NOT_ACCESS,
        };
    }

    const startDate = stringToDate(validation.data.rawStartDate);
    const endDate = stringToDate(validation.data.rawEndDate);
    const searchEndDate = new Date(endDate);
    searchEndDate.setUTCDate(searchEndDate.getUTCDate() + 1);

    if (endDate < startDate) {
        return {
            code: RESPONSES.DATES.BAD_DATES,
        };
    }

    const vacationRequest = await getVacationRequestById(vacationRequestId);

    if (!vacationRequest) {
        return {
            code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
        };
    }

    if (
        hasDateStartedInMexico(vacationRequest.start) ||
        hasDateStartedInMexico(startDate)
    ) {
        return {
            code: RESPONSES.VACATION.REQUEST_ALREADY_STARTED,
        };
    }

    const targetEmployeeId = vacationRequest.employee_id;
    const actorRoleName = actorEmployee.role?.name;
    const isSelfModification = actorEmployeeId === targetEmployeeId;
    const isCoordinatorModification =
        isCoordinatorRole(actorRoleName) && !isSelfModification;

    if (
        isSelfModification &&
        vacationRequest.status !== VACATION_STATUS.PENDING
    ) {
        return {
            code: RESPONSES.VACATION.SELF_REQUEST_NOT_MODIFIABLE,
        };
    }

    if (
        vacationRequest.status !== VACATION_STATUS.PENDING &&
        vacationRequest.status !== VACATION_STATUS.APPROVED
    ) {
        return {
            code: RESPONSES.VACATION.REQUEST_NOT_MODIFIABLE,
        };
    }

    const targetEmployee = await findByIdWithRoleAndHouse(targetEmployeeId);

    if (!targetEmployee) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    if (!isSelfModification && isAdminRole(targetEmployee.role?.name)) {
        return {
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        };
    }

    if (
        isCoordinatorModification &&
        actorEmployee.house_id !== targetEmployee.house_id
    ) {
        return {
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        };
    }

    if (!isSelfModification && !isCoordinatorModification) {
        return {
            code: RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS,
        };
    }

    const vacationYearResult =
        await getVacationYearInfoForApproval(targetEmployeeId);

    if (!vacationYearResult.data) {
        return {
            code: vacationYearResult.code,
        };
    }

    const anniversaryStartDate = vacationYearResult.data.startDate;
    const anniversaryEndDate = vacationYearResult.data.endDate;
    const maxDays = vacationYearResult.data.maxDays;

    if (endDate > anniversaryEndDate || startDate < anniversaryStartDate) {
        return {
            code: RESPONSES.VACATION.OUT_OF_RANGE,
        };
    }

    const workDays = await getWorkDays(targetEmployeeId);

    if (workDays.length === 0) {
        return {
            code: RESPONSES.VACATION.WITHOUT_DATES,
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

    if (usedDays === 0) {
        return {
            code: RESPONSES.VACATION.NULL_DATES,
        };
    }

    const updateResult = await updateVacationRequestDatesAtomically({
        vacationRequestId,
        employeeId: targetEmployeeId,
        actorHouseId: actorEmployee.house_id,
        startDate,
        endDate,
        usedDays,
        anniversaryStartDate,
        anniversaryEndDate,
        maxDays,
    });

    if (!updateResult.success) {
        return {
            code: updateResult.code,
        };
    }

    try {
        await createLog(
            actorEmployeeId,
            LOG_ACTIONS.VACATION_UPDATED_SUCCESS,
            ipAddress,
            targetEmployeeId
        );
    } catch (error) {
        console.error("Error creando log de modificación de vacaciones:", error);
    }

    return {
        code: RESPONSES.VACATION.UPDATED,
        data: {
            vacationRequest: updateResult.data.vacationRequest,
        },
    };
};

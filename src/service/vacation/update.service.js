const {
    findByIdWithRoleAndHouse,
    getWorkDays,
} = require("../../model/employee/get.model");
const {
    getVacationRequestById,
} = require("../../model/vacation/get.model");
const {
    getGlobalEventsInRange,
} = require("../../model/event/get.model");
const {
    approveVacationRequestAtomically,
} = require("../../model/vacation/update.model");
const {
    calculateUsedDays,
} = require("../../utils/dates");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const { VACATION_STATUS } = require("../../utils/vacationStatus");
const {
    approveVacationRequestInputSchema,
} = require("../../schemas/vacation/update.schemas");
const { getVacationYearInfoForApproval } = require("./get.service");

exports.approveVacationRequest = async ({
    actorEmployeeId,
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

    if (actorRoleName !== "Admin" && actorRoleName !== "Coordinador") {
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

    const targetRoleName = targetEmployee.role?.name?.toLowerCase();

    if (actorRoleName === "Coordinador") {
        if (targetRoleName === "admin") {
            return {
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            };
        }

        if (actorEmployee.house_id !== targetEmployee.house_id) {
            return {
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            };
        }
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

    const globalEvents = await getGlobalEventsInRange(
        vacationRequest.start,
        vacationRequest.end
    );

    const usedDays = calculateUsedDays(
        workDays,
        vacationRequest.start,
        vacationRequest.end,
        globalEvents
    );

    if (usedDays === 0) {
        return {
            code: RESPONSES.VACATION.NULL_DATES,
        };
    }

    const approvalResult = await approveVacationRequestAtomically({
        vacationRequestId,
        employeeId: targetEmployeeId,
        actorRoleName,
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

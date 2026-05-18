const {
    findByIdWithRoleAndHouse,
} = require("../../model/employee/get.model");
const {
    getVacationRequestById,
} = require("../../model/vacation/get.model");
const {
    deleteVacationRequestAtomically,
} = require("../../model/vacation/delete.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const { ROLES } = require("../../utils/roles");
const {
    deleteVacationRequestInputSchema,
} = require("../../schemas/vacation/delete.schemas");


exports.deleteVacationRequest = async ({
    actorEmployeeId,
    vacationRequestId,
    ipAddress,
}) => {
    const validation = deleteVacationRequestInputSchema.safeParse({
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

    const targetEmployeeId = vacationRequest.employee_id;

    const targetEmployee = await findByIdWithRoleAndHouse(targetEmployeeId);

    if (!targetEmployee) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const targetRoleName = targetEmployee.role?.name;

    if (targetRoleName === ROLES.ADMIN) {
        return {
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        };
    }

    if (actorEmployee.house_id !== targetEmployee.house_id) {
        return {
            code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
        };
    }

    const deleteResult = await deleteVacationRequestAtomically({
        vacationRequestId,
        employeeId: targetEmployeeId,
        actorHouseId: actorEmployee.house_id,
    });

    if (!deleteResult.success) {
        return {
            code: deleteResult.code,
        };
    }

    try {
        await createLog(
            actorEmployeeId,
            LOG_ACTIONS.VACATION_DELETED_SUCCESS,
            ipAddress,
            targetEmployeeId
        );
    } catch (error) {
        console.error("Error creando log de eliminación de vacaciones:", error);
    }

    return {
        code: RESPONSES.VACATION.DELETED,
        data: {
            vacationRequest: deleteResult.data.vacationRequest,
        },
    };
};

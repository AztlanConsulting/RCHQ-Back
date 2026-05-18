const {
    getEmployeeToDeactivate,
    deactivateEmployee,
} = require("../../model/employee/deactivate.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

exports.deactivateEmployee = async (req) => {
    const { employeeId } = req.params;
    const { reason } = req.body;
    const actorId = req.user.id;
    const ip = getClientIp(req);

    const employee = await getEmployeeToDeactivate(employeeId);

    if (!employee) {
        return { code: RESPONSES.EMPLOYEE.NOT_FOUND };
    }

    if (!employee.isActive) {
        return { code: RESPONSES.EMPLOYEE.ALREADY_INACTIVE };
    }

    try {
        await deactivateEmployee(employeeId, reason);
        await createLog(
            actorId,
            LOG_ACTIONS.EMPLOYEE_DEACTIVATED,
            ip,
            employeeId,
        );
        return {
            code: RESPONSES.EMPLOYEE.DEACTIVATED,
            data: { name: employee.name },
        };
    } catch (error) {
        console.error("Error al desactivar al empleado:", error);
        await createLog(
            actorId,
            LOG_ACTIONS.EMPLOYEE_DEACTIVATION_FAILED,
            ip,
            employeeId,
        );
        return {
            code: RESPONSES.EMPLOYEE.DEACTIVATION_FAILED,
            data: { name: employee.name },
        };
    }
};

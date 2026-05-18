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
    const { reason, addToBlacklist } = req.body;
    const actorId = req.user.id;
    const ip = getClientIp(req);

    if (actorId === employeeId) {
        return { code: RESPONSES.EMPLOYEE.CANNOT_DEACTIVATE_SELF };
    }

    const employee = req.resolvedEmployee || await getEmployeeToDeactivate(employeeId);

    if (!employee) {
        return { code: RESPONSES.EMPLOYEE.NOT_FOUND };
    }

    if (!employee.isActive && !addToBlacklist) {
        return { code: RESPONSES.EMPLOYEE.ALREADY_INACTIVE };
    }

    if (addToBlacklist && employee.isBlacklisted) {
        return { code: RESPONSES.EMPLOYEE.ALREADY_BLACKLISTED };
    }

    try {
        const curpToBlacklist = addToBlacklist ? employee.curp : null;
        await deactivateEmployee(employeeId, reason, curpToBlacklist, employee.isActive);
        
        try {
            await createLog(actorId, LOG_ACTIONS.EMPLOYEE_DEACTIVATED, ip, employeeId);
        } catch (logError) {
            console.error("Baja exitosa pero falló el log de auditoría:", logError);
        }

        return {
            code: RESPONSES.EMPLOYEE.DEACTIVATED,
            data: { name: employee.name },
        };
    } catch (error) {
        console.error("Error al desactivar al empleado:", error);
        return {
            code: RESPONSES.EMPLOYEE.DEACTIVATION_FAILED,
            data: { name: employee.name },
        };
    }
};

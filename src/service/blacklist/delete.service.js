const { findEmployeeByCurp } = require("../../model/blacklist/get.model");
const { deleteFromBlacklist } = require("../../model/blacklist/delete.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");

exports.removeFromBlacklist = async (curp, reason, executorId, ipAddress) => {
    try {
        const employee = await findEmployeeByCurp(curp);
        if (!employee) return { code: RESPONSES.EMPLOYEE.NOT_FOUND };

        if (!employee.isBlacklisted) return { code: RESPONSES.BLACKLIST.NOT_IN_BLACKLIST };

        const deletedEntry = await deleteFromBlacklist(curp, reason);
        if (!deletedEntry) return { code: RESPONSES.BLACKLIST.INTERNAL_ERROR };

        let warning = null;
        try {
            const affectedText = `${employee.name} ${employee.surname} - ${curp}`;
            await createLog(executorId, LOG_ACTIONS.BLACKLIST_REMOVED, ipAddress, affectedText);
        } catch (err) {
            console.error("Error creando log removeFromBlacklist:", err);
            warning = "Empleado eliminado de la lista negra, pero falló el registro de auditoría (log).";
        }

        return {
            code: RESPONSES.BLACKLIST.REMOVED,
            data: {
                employeeFullName: `${employee.name} ${employee.surname}`,
                curp: employee.curp,
                warning,
            },
        };
    } catch (error) {
        console.error("Error inesperado en removeFromBlacklist service:", error);
        return { code: RESPONSES.BLACKLIST.INTERNAL_ERROR };
    }
};
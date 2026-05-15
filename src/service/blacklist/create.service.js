const { findEmployeeByCurp } = require("../../model/blacklist/get.model");
const { transactionalBlacklistInsert } = require("../../model/blacklist/patch.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");

exports.insertIntoBlacklist = async (curp, executorId, ipAddress) => {
    try {
        const employee = await findEmployeeByCurp(curp);
        if (!employee) return { code: RESPONSES.EMPLOYEE.NOT_FOUND };

        if (employee.isBlacklisted) return { code: RESPONSES.BLACKLIST.ALREADY_EXISTS };

        const blacklistEntry = await transactionalBlacklistInsert(curp);
        if (!blacklistEntry) return { code: RESPONSES.BLACKLIST.INSERT_FAILED };

        let warning = null;
        try {
            await createLog(
                executorId,
                LOG_ACTIONS.BLACKLIST_ADDED,
                ipAddress,
                `${employee.name} ${employee.surname} - ${employee.curp}`
            );
        } catch (err) {
            console.error("Error creando log insertIntoBlacklist:", err);
            warning = "Empleado agregado a la lista negra, pero falló el registro de auditoría (log).";
        }

        return {
            code: RESPONSES.BLACKLIST.ADDED,
            data: {
                employeeFullName: `${employee.name} ${employee.surname}`,
                curp: employee.curp,
                blacklistEntry,
                warning,
            },
        };
    } catch (error) {
        console.error("Error inesperado en insertIntoBlacklist service:", error);
        return { code: RESPONSES.BLACKLIST.INTERNAL_ERROR };
    }
};
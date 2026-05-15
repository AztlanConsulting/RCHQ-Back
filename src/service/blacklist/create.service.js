const { findEmployeeByCurp } = require("../../model/blacklist/get.model");
const { transactionalBlacklistInsert } = require("../../model/blacklist/patch.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");

exports.insertIntoBlacklist = async (curp, executorId, ipAddress) => {
    const employee = await findEmployeeByCurp(curp);
    if (!employee) return { code: RESPONSES.BLACKLIST.EMPLOYEE_NOT_FOUND };

    const blacklistEntry = await transactionalBlacklistInsert(curp);
    if (!blacklistEntry) return { code: RESPONSES.BLACKLIST.INSERT_FAILED };

    if (blacklistEntry) {
        try {
                await createLog(
                    executorId,
                    LOG_ACTIONS.BLACKLIST_ADDED,
                    ipAddress,
                    `${employee.name} ${employee.surname} - ${employee.curp}`
                );
            } catch (err) {
                console.error("Error creando log insertIntoBlacklist:", err);
                return { code: RESPONSES.BLACKLIST.LOG_FAILED };
            }
    }

    return {
        code: RESPONSES.BLACKLIST.ADDED,
        data: {
            employeeFullName: `${employee.name} ${employee.surname}`,
            curp: employee.curp,
            blacklistEntry,
        },
    };
};
const { findEmployeeById } = require("../../model/blacklist/get.model");
const { deactivateEmployee } = require("../../model/blacklist/patch.model");
const { insertBlacklist } = require("../../model/blacklist/create.model");
const RESPONSES = require("../../utils/responses");

exports.insertIntoBlacklist = async (employeeId) => {
    const employee = await findEmployeeById(employeeId);
    if (!employee) return { type: RESPONSES.BLACKLIST.EMPLOYEE_NOT_FOUND };

    const deactivated = await deactivateEmployee(employeeId);
    if (!deactivated) return { type: RESPONSES.BLACKLIST.DEACTIVATION_FAILED };

    const blacklistEntry = await insertBlacklist(employeeId, employee.curp);
    if (!blacklistEntry) return { type: RESPONSES.BLACKLIST.INSERT_FAILED };

    return {
        type: RESPONSES.BLACKLIST.ADDED,
        data: {
            employeeFullName: `${employee.name} ${employee.surname}`,
            curp: employee.curp,
            blacklistEntry,
        },
    };
};
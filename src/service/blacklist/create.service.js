const { findEmployeeById } = require("../../model/blacklist/get.model");
const { transactionalBlacklistInsert } = require("../../model/blacklist/patch.model");
const RESPONSES = require("../../utils/responses");

exports.insertIntoBlacklist = async (employeeId) => {
    const employee = await findEmployeeById(employeeId);
    if (!employee) return { code: RESPONSES.BLACKLIST.EMPLOYEE_NOT_FOUND };

    const blacklistEntry = await transactionalBlacklistInsert(employeeId, employee.curp);
    if (!blacklistEntry) return { code: RESPONSES.BLACKLIST.INSERT_FAILED };

    return {
        code: RESPONSES.BLACKLIST.ADDED,
        data: {
            employeeFullName: `${employee.name} ${employee.surname}`,
            curp: employee.curp,
            blacklistEntry,
        },
    };
};
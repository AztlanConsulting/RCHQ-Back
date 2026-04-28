const {
  getEmployeeToDeactivate,
  deactivateEmployee,
  insertIntoBlacklist,
} = require("../../model/employee/deactivate.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

exports.deactivateEmployee = async (req) => {
  const { employeeId } = req.params;
  const { reason, intoBlacklist } = req.body;
  const actorId = req.user.id;
  const ip = getClientIp(req);

  const employee = await getEmployeeToDeactivate(employeeId);

  if (!employee) {
    return { code: RESPONSES.employee.notFound };
  }

  if (!employee.isActive) {
    return { code: RESPONSES.employee.alreadyInactive };
  }

  try {
    await deactivateEmployee(employeeId);
    await createLog(actorId, LOG_ACTIONS.EMPLOYEE_DEACTIVATED, ip, employeeId);
  } catch (error){
    console.error("Error al desactivar al empleado:", error);
    await createLog(actorId, LOG_ACTIONS.EMPLOYEE_DEACTIVATION_FAILED, ip, employeeId);
    return { code: RESPONSES.employee.deactivationFailed };
  }

  if (intoBlacklist) {
    try {
      await insertIntoBlacklist(employee.curp, employee.name, employee.surname, reason);
      await createLog(actorId, LOG_ACTIONS.EMPLOYEE_INTO_BLACKLIST, ip, employeeId);
      return { code: RESPONSES.employee.deactivatedAndBlacklisted };
    } catch (error) {
      console.error("Error al agregar empleado a la lista negra:", error);
      await createLog(actorId, LOG_ACTIONS.EMPLOYEE_BLACKLIST_FAILED, ip, employeeId);
      return { code: RESPONSES.employee.deactivatedBlacklistFailed };
    }
  }

  return { code: RESPONSES.employee.deactivated };
};
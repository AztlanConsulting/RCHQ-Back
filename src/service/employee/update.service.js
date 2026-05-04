const {
  updateBasicInfo,
  updateContactInfo,
  updateAdminInfo,
  upsertWorkdays,
  getAllWorkdays,
  getAllHouses,
} = require("../../model/employee/update.model");
const { findById, getAllRoles } = require("../../model/employee/get.model");
const { encryptValue } = require("../../utils/password");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");
const {
  employeeBasicUpdateSchema,
  employeeContactUpdateSchema,
  employeeAdminUpdateSchema,
} = require("../../schemas/employee/update.schemas");
const RESPONSES = require("../../utils/responses");

// ── Catálogos para el formulario de edición ───────────────────────────────────

exports.getUpdateFormData = async (user) => {
  const [roles, houses, workdays] = await Promise.all([
    getAllRoles(),
    getAllHouses(),
    getAllWorkdays(),
  ]);
  return { roles, houses, workdays, houseId: user.houseId };
};

// ── Actualizar información básica ─────────────────────────────────────────────

exports.updateBasicInfoService = async (requesterId, employeeId, body, req) => {
  if (!requesterId || !employeeId) {
    return { type: RESPONSES.EMPLOYEE.BAD_REQUEST };
  }

  const parsed = employeeBasicUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return {
      type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
      errors: parsed.error.issues.map((e) => ({ campo: e.path[0], mensaje: e.message })),
    };
  }

  const employee = await findById(employeeId);
  if (!employee) return { type: RESPONSES.EMPLOYEE.NOT_FOUND };

  await updateBasicInfo(employeeId, parsed.data);

  try {
    await createLog(requesterId, LOG_ACTIONS.EMPLOYEE_UPDATED, employeeId, getClientIp(req));
  } catch (error) {
    console.error("Error creando log de actualización de empleado:", error);
  }

  return { type: RESPONSES.EMPLOYEE.UPDATED };
};


exports.updateContactInfoService = async (requesterId, employeeId, body, req) => {
  if (!requesterId || !employeeId) {
    return { type: RESPONSES.EMPLOYEE.BAD_REQUEST };
  }

  const parsed = employeeContactUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return {
      type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
      errors: parsed.error.issues.map((e) => ({ campo: e.path[0], mensaje: e.message })),
    };
  }

  const employee = await findById(employeeId);
  if (!employee) return { type: RESPONSES.EMPLOYEE.NOT_FOUND };

  await updateContactInfo(employeeId, parsed.data);

  try {
    await createLog(requesterId, LOG_ACTIONS.EMPLOYEE_UPDATED, employeeId, getClientIp(req));
  } catch (error) {
    console.error("Error creando log de actualización de empleado:", error);
  }

  return { type: RESPONSES.EMPLOYEE.UPDATED };
};

exports.updateAdminInfoService = async (requesterId, employeeId, body, req) => {
  if (!requesterId || !employeeId) {
    return { type: RESPONSES.EMPLOYEE.BAD_REQUEST };
  }

  const parsed = employeeAdminUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return {
      type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
      errors: parsed.error.issues.map((e) => ({ campo: e.path[0], mensaje: e.message })),
    };
  }

  const employee = await findById(employeeId);
  if (!employee) return { type: RESPONSES.EMPLOYEE.NOT_FOUND };

  const { workdays, salary, ...rest } = parsed.data;

  // Encriptar salario si viene
  if (salary !== undefined) {
    rest.salary = encryptValue(String(salary));
  }

  if (Object.keys(rest).length > 0) {
    await updateAdminInfo(employeeId, rest);
  }

  if (workdays && workdays.length > 0) {
    await upsertWorkdays(employeeId, workdays);
  }

  try {
    await createLog(requesterId, LOG_ACTIONS.EMPLOYEE_UPDATED, employeeId, getClientIp(req));
  } catch (error) {
    console.error("Error creando log de actualización de empleado:", error);
  }

  return { type: RESPONSES.EMPLOYEE.UPDATED };
};
// src/service/employee/employeeAdd.service.js
const { create } = require("../../model/employee/employeeAdd.model");
const {
  findById,
  findByCurp,
  getAllRoles,
} = require("../../model/employee/consult.model");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { hashPassword } = require("../../utils/password");
const {
  employeeCreateSchema,
} = require("../../schemas/employee/employeeAdd.schemas");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { v4: uuidv4 } = require("uuid");
const { createEmployeePolicy } = require("../../policies/employeeAdd.policies");

async function getById(id) {
  return await findById(id);
}

async function getRoles() {
  return await getAllRoles();
}

async function createEmployee(data, user, req) {
  const result = employeeCreateSchema.safeParse(data);

  if (!result.success) {
    return {
      status: 400,
      body: {
        errors: result.error.issues.map((e) => ({
          campo: e.path[0],
          mensaje: e.message,
        })),
      },
    };
  }

  const validatedData = result.data;
  const resource = { house_id: validatedData.house_id };

  if (!createEmployeePolicy(user, resource)) {
    return {
      status: 403,
      body: { message: "Acceso Denegado" },
    };
  }

  const {
    role_id,
    name,
    surname,
    email,
    curp,
    rfc,
    nss,
    bank_account,
    birth_date,
    picture,
  } = validatedData;

  const existing = await findByCurp(curp);

  if (existing) {
    return {
      status: 409,
      body: {
        error: "Empleado ya existente",
        redirect: `/employee/${existing.employee_id}`,
      },
    };
  }

  const password = "red_de_casas_hogar";
  const hashedPassword = await hashPassword(password);

  const newEmployee = await create({
    employee_id: uuidv4(),
    house_id: user.houseId,
    role_id,
    name,
    surname,
    is_active: true,
    email,
    password: hashedPassword,
    has_first_login: true,
    totp_secret: null,
    curp,
    rfc,
    nss,
    bank_account,
    birth_date: birth_date ? new Date(birth_date) : null,
    picture: picture || null,
    start_date: new Date(),
  });

  const actorId = user?.id;
  let logError = null;

  try {
    await createLog(
      actorId,
      LOG_ACTIONS.EMPLOYEE_CREATED,
      getClientIp(req),
      newEmployee.employee_id,
    );
  } catch (error) {
    console.error("Error creando log:", error);
    logError = error;
  }

  return {
    status: 201,
    body: {
      message: "Empleado creado con éxito.",
      redirect: `/employee/${newEmployee.employee_id}`,
      warning: logError ? "Empleado creado pero el log falló" : null,
    },
  };
}

module.exports = {
  getById,
  getRoles,
  createEmployee,
};

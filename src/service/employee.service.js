const Employee = require("../model/employee.model");
const { createLog } = require("../model/log.model");
const { getClientIp } = require("../utils/ip");
const { hashPassword } = require("../utils/password");
const { employeeCreateSchema } = require("../schemas/employee.schemas");
const { LOG_ACTIONS } = require("../utils/logActions");
const { v4: uuidv4 } = require("uuid");

const EmployeeService = {
  async getById(id) {
    return await Employee.findById(id);
  },

  async getRoles() {
    const prisma = require("../prisma");
    return await prisma.role.findMany();
  },

  async createEmployee(req) {
    const result = employeeCreateSchema.safeParse(req.body);

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

    const {
      house_id,
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
    } = result.data;

    const existing = await Employee.findByCurp(curp);

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

    const newEmployee = await Employee.create({
      employee_id: uuidv4(),
      house_id: req.user.houseId,
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
      picture,
      start_date: new Date(),
    });

    const actorId = req.user?.id;

    let logError = null;

    try {
      await createLog(
        actorId,
        LOG_ACTIONS.EMPLOYEE_CREATED,
        newEmployee.employee_id,
        getClientIp(req),
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
        warning: logError
          ? "Empleado creado pero el log falló"
          : null,
      },
    };
  },
};

module.exports = EmployeeService;
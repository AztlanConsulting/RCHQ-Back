const Employee = require("../model/employee.model");
const Logs = require("../model/log.model");
const { hashPassword } = require("../utils/hashPwd");
const { v4: uuidv4 } = require("uuid");

const employeeController = {
  getAdd(req, res) {
    res.status(200).json({
      message: "Aquí se renderizará el formulario en React"
    });
  },

  async getById(req, res) {
    try {
      const { id } = req.params;

      const employee = await Employee.findById(id);

      if (!employee) {
        return res.status(404).json({
          error: "Empleado no encontrado"
        });
      }

      return res.status(200).json(employee);

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Error interno del servidor. Por favor intente más tarde."
      });
    }
  },

  async postAdd(req, res) {
    try {
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
        picture
      } = req.body;

      if (!house_id || !role_id || !name || !surname || !email || !curp) {
        return res.status(400).json({
          error: "Campos obligatorios faltantes. Intenta más tarde."
        });
      }

      const existing = await Employee.findByCurp(curp);

      if (existing) {
        return res.status(409).json({
          error: "Empleado ya existente",
          redirect: `/employee/${existing.employee_id}`
        });
      }

      const password = "red_de_casas_hogar";
      const hashedPassword = await hashPassword(password);

      const newEmployee = await Employee.create({
        employee_id: uuidv4(),
        house_id,
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
        start_date: new Date()
      });

      // Eliminar cuando se haga la integración con el login
      const actorId = req.user?.employee_id || "8f55364d-1a53-43b6-a18f-3c73c9092797";

      await Logs.create({
        log_id: uuidv4(),
        employee_id: actorId,
        moment: new Date(),
        action_id: "emp-001",
        affected: newEmployee.employee_id,
        ip_address: req.ip
      });

      return res.status(201).json({
        message: "Empleado creado con éxito.",
        redirect: `/employee/${newEmployee.employee_id}`
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "No se pudo registrar correctamente el log."
      });
    }
  }
};

module.exports = employeeController;
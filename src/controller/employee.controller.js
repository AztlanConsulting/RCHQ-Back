const EmployeeService = require("../service/employee.service");

const employeeController = {
  getAdd(req, res) {
    return res.status(200).json({
      message: "Aquí se renderizará el formulario en React"
    });
  },

  async getById(req, res) {
    try {
      const result = await EmployeeService.getById(req.params.id);

      if (!result) {
        return res.status(404).json({
          error: "Empleado no encontrado"
        });
      }

      return res.status(200).json(result);

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Error interno del servidor. Por favor intente más tarde."
      });
    }
  },

  async postAdd(req, res) {
    try {
      const result = await EmployeeService.createEmployee(req);

      return res.status(result.status).json(result.body);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "No se pudo registrar correctamente el empleado"
      });
    }
  }
};

module.exports = employeeController;
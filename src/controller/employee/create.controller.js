const fs = require("fs");
const {
  getRoles,
  getById: getEmployeeById,
  createEmployee,
} = require("../../service/employee/create.service");
const deleteFileIfExists = (filePath) => {
  if (!filePath) return;

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error eliminando archivo:", err.message);
    }
  });
};

exports.getAdd = async (req, res) => {
  try {
    const roles = await getRoles();

    return res.status(200).json({
      roles,
      houseId: req.user.houseId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error cargando datos del formulario",
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const employee = await getEmployeeById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        error: "Empleado no encontrado",
      });
    }

    return res.status(200).json(employee);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

exports.postAdd = async (req, res) => {
  try {
    const employee = {
      ...req.body,
      picture: req.file ? req.file.path : null,
    };

    const result = await createEmployee(employee, req.user, req);

    if (!result.success) {
      deleteFileIfExists(req.file?.path);
      switch (result.type) {
        case "VALIDATION_ERROR":
          return res.status(400).json({
            errors: result.errors,
          });

        case "FORBIDDEN":
          return res.status(403).json({
            error: result.message,
          });

        case "CONFLICT":
          return res.status(409).json({
            error: result.message,
            redirect: `/employee/${result.employeeId}`,
          });

        default:
          return res.status(400).json({
            error: result.message,
          });
      }
    }

    return res.status(201).json({
      message: "Empleado creado con éxito.",
      redirect: `/employee/${result.employeeId}`,
      warning: result.warning,
    });
  } catch (error) {
    console.error(error);
    deleteFileIfExists(req.file?.path);

    return res.status(500).json({
      error: "No se pudo registrar correctamente el empleado",
    });
  }
};

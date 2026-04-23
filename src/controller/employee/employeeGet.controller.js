// controller/employee/employeeGet.controller.js
const {
  getRoles,
  getById,
  getDocumentsByEmployee,
} = require("../../service/employee/employeeGet.service");

exports.getAdd = async (req, res) => {
  try {
    const roles = await getRoles();

    return res.status(200).json({
      roles,
      house_id: req.user.houseId,
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
    const result = await getById(req.params.id);

    if (!result) {
      return res.status(404).json({
        error: "Empleado no encontrado",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error interno del servidor. Por favor intente más tarde.",
    });
  }
};

exports.getDocumentsByEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ success: false, message: "Bad Request" });

    const result = await getDocumentsByEmployee(id);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("getDocumentsByEmployee error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const {
  getUpdateFormData,
  updateBasicInfoService,
  updateContactInfoService,
  updateAdminInfoService,
} = require("../../service/employee/update.service");
const RESPONSES = require("../../utils/responses");

// Respuestas comunes reutilizables
const handleUpdateResult = (res, result) => {
  if (result.type === RESPONSES.EMPLOYEE.BAD_REQUEST)
    return res.status(400).json({ success: false, message: "Body incompleto para este request" });

  if (result.type === RESPONSES.EMPLOYEE.VALIDATION_ERROR)
    return res.status(400).json({ success: false, message: "Datos inválidos", errors: result.errors });

  if (result.type === RESPONSES.EMPLOYEE.NOT_FOUND)
    return res.status(404).json({ success: false, message: "Empleado no encontrado" });

  if (result.type === RESPONSES.EMPLOYEE.UPDATED)
    return res.status(200).json({ success: true, message: "Información actualizada con éxito" });

  return res.status(500).json({ success: false, message: "Error interno inesperado" });
};

// GET /employee/update-form — catálogos para el formulario
exports.getUpdateForm = async (req, res) => {
  try {
    const data = await getUpdateFormData(req.user);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error("getUpdateForm error:", err);
    return res.status(500).json({ success: false, message: "Error cargando datos del formulario" });
  }
};

// PUT /employee/:employeeId/basic-info
exports.updateBasicInfo = async (req, res) => {
  try {
    const result = await updateBasicInfoService(
      req.user.id,
      req.params.employeeId,
      req.body,
      req,
    );
    return handleUpdateResult(res, result);
  } catch (err) {
    console.error("updateBasicInfo error:", err);
    return res.status(500).json({ success: false, message: "Error Interno del Servidor" });
  }
};

// PUT /employee/:employeeId/contact-info
exports.updateContactInfo = async (req, res) => {
  try {
    const result = await updateContactInfoService(
      req.user.id,
      req.params.employeeId,
      req.body,
      req,
    );
    return handleUpdateResult(res, result);
  } catch (err) {
    console.error("updateContactInfo error:", err);
    return res.status(500).json({ success: false, message: "Error Interno del Servidor" });
  }
};

// PUT /employee/:employeeId/admin-info
exports.updateAdminInfo = async (req, res) => {
  try {
    const result = await updateAdminInfoService(
      req.user.id,
      req.params.employeeId,
      req.body,
      req,
    );
    return handleUpdateResult(res, result);
  } catch (err) {
    console.error("updateAdminInfo error:", err);
    return res.status(500).json({ success: false, message: "Error Interno del Servidor" });
  }
};
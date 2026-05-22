const {
  updateBasicInfoService,
  updateContactInfoService,
  updateAdminInfoService,
} = require("../../service/employee/update.service");
const { updateDocument } = require("../../service/employee/update.service");
const RESPONSES = require("../../utils/responses");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");

exports.updateBasicInfo = async (req, res) => {
  const { employeeId } = req.params;
  const requesterId = req.user.id;
  const body = req.body;
  const file = req.file;

  try {
    const result = await updateBasicInfoService({
      requesterId,
      employeeId,
      body,
      file,
    });

    if (result.type === RESPONSES.EMPLOYEE.BAD_REQUEST)
      return res.status(400).json({ success: false, message: "Body incompleto para este request" });

    if (result.type === RESPONSES.EMPLOYEE.VALIDATION_ERROR)
      return res.status(400).json({ success: false, message: "Datos inválidos", errors: result.errors });

    if (result.type === RESPONSES.EMPLOYEE.NOT_FOUND)
      return res.status(404).json({ success: false, message: "Empleado no encontrado" });

    if (result.type === RESPONSES.EMPLOYEE.UPDATED) {
      try {
        await createLog(requesterId, LOG_ACTIONS.EMPLOYEE_UPDATED, getClientIp(req), employeeId);
      } catch (err) {
        console.error("Error creando log updateBasicInfo:", err);
      }
      return res.status(200).json({ success: true, message: "Información básica actualizada con éxito" });
    }

    return res.status(500).json({ success: false, message: "Error interno inesperado" });
  } catch (err) {
    console.error("updateBasicInfo error:", err);
    return res.status(500).json({ success: false, message: "Error Interno del Servidor" });
  }
};

exports.updateContactInfo = async (req, res) => {
  const { employeeId } = req.params;
  const requesterId = req.user.id;
  const body = req.body;

  try {
    const result = await updateContactInfoService({
      requesterId,
      employeeId,
      body
    });

    if (result.type === RESPONSES.EMPLOYEE.BAD_REQUEST)
      return res.status(400).json({ success: false, message: "Body incompleto para este request" });

    if (result.type === RESPONSES.EMPLOYEE.VALIDATION_ERROR)
      return res.status(400).json({ success: false, message: "Datos inválidos", errors: result.errors });

    if (result.type === RESPONSES.EMPLOYEE.NOT_FOUND)
      return res.status(404).json({ success: false, message: "Empleado no encontrado" });

    if (result.type === RESPONSES.EMPLOYEE.UPDATED) {
      try {
        await createLog(requesterId, LOG_ACTIONS.EMPLOYEE_UPDATED, getClientIp(req), employeeId);
      } catch (err) {
        console.error("Error creando log updateContactInfo:", err);
      }
      return res.status(200).json({ success: true, message: "Información de contacto actualizada con éxito" });
    }

    return res.status(500).json({ success: false, message: "Error interno inesperado" });
  } catch (err) {
    console.error("updateContactInfo error:", err);
    return res.status(500).json({ success: false, message: "Error Interno del Servidor" });
  }
};

exports.updateAdminInfo = async (req, res) => {
  const { employeeId } = req.params;
  const requesterId = req.user.id;
  const body = req.body;

  try {
    const result = await updateAdminInfoService({
      requesterId,
      employeeId,
      body
    });

    if (result.type === RESPONSES.EMPLOYEE.BAD_REQUEST)
      return res.status(400).json({ success: false, message: "Body incompleto para este request" });

    if (result.type === RESPONSES.EMPLOYEE.VALIDATION_ERROR)
      return res.status(400).json({ success: false, message: "Datos inválidos", errors: result.errors });

    if (result.type === RESPONSES.EMPLOYEE.NOT_FOUND)
      return res.status(404).json({ success: false, message: "Empleado no encontrado" });

    if (result.type === RESPONSES.EMPLOYEE.UPDATED) {
      try {
        await createLog(requesterId, LOG_ACTIONS.EMPLOYEE_UPDATED, getClientIp(req), employeeId);
      } catch (err) {
        console.error("Error creando log updateAdminInfo:", err);
      }
      return res.status(200).json({ success: true, message: "Información administrativa actualizada con éxito" });
    }

    return res.status(500).json({ success: false, message: "Error interno inesperado" });
  } catch (err) {
    console.error("updateAdminInfo error:", err);
    return res.status(500).json({ success: false, message: "Error Interno del Servidor" });
  }
};
exports.updateDocument = async (req, res) => {
    try {
        const { id, field } = req.params;
        const file = req.file;

        if (!id || !field || !file) {
            return res
                .status(400)
                .json({ success: false, message: "Faltan campos requeridos" });
        }

        const result = await updateDocument(id, field, file);

        if (result.type === RESPONSES.DOCUMENTS.UPLOADED) {
            try {
                await createLog(
                    req.user.id,
                    LOG_ACTIONS.DOCUMENT_UPDATED,
                    getClientIp(req),
                    id,
                );
            } catch (err) {
                console.error("Error creando log:", err);
            }
            return res.status(200).json(result.body);
        }
        if (result.type === RESPONSES.DOCUMENTS.NOT_ALLOW)
            return res.status(400).json(result.body);
        if (result.type === RESPONSES.USER.NOT_FOUND)
            return res.status(404).json(result.body);
        if (result.type === RESPONSES.DOCUMENTS.NOT_FOUND)
            return res.status(404).json(result.body);
    } catch (err) {
        console.error("updateDocument error:", err);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
};

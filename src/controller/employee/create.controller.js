const fs = require("fs");
const {
  getRoles,
  getById: getEmployeeById,
  createEmployee,
  uploadDocument,
  updateDocument,
} = require("../../service/employee/create.service");
const { RESPONSE } = require("../../utils/response");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");

const deleteFileIfExists = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error eliminando archivo:", err.message);
  });
};

exports.getAdd = async (req, res) => {
  try {
    const roles = await getRoles();
    return res.status(200).json({ roles, houseId: req.user.houseId });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error cargando datos del formulario" });
  }
};

exports.getById = async (req, res) => {
  try {
    const employee = await getEmployeeById(req.params.id);
    if (!employee)
      return res.status(404).json({ error: "Empleado no encontrado" });
    return res.status(200).json(employee);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.postAdd = async (req, res) => {
  try {
    const employee = { ...req.body, picture: req.file ? req.file.path : null };
    const result = await createEmployee(employee, req.user, req);

    if (!result.success) {
      deleteFileIfExists(req.file?.path);
      switch (result.type) {
        case "VALIDATION_ERROR":
          return res.status(400).json({ errors: result.errors });
        case "FORBIDDEN":
          return res.status(403).json({ error: result.message });
        case "CONFLICT":
          return res.status(409).json({
            error: result.message,
            redirect: `/employee/${result.employeeId}`,
          });
        default:
          return res.status(400).json({ error: result.message });
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
    return res
      .status(500)
      .json({ error: "No se pudo registrar correctamente el empleado" });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentField } = req.body;
    const file = req.file;

    if (!id || !documentField || !file) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan campos requeridos" });
    }

    const result = await uploadDocument(id, file, documentField);
    if (result.type === RESPONSE.DOCUMENTS.UPLOAD) {
      try {
        await createLog(
          req.user.id,
          LOG_ACTIONS.DOCUMENT_UPLOADED,
          getClientIp(req),
          id,
        );
      } catch (err) {
        console.error("Error creando log:", err);
      }
      return res.status(201).json(result.body);
    }
    if (result.type === RESPONSE.DOCUMENTS.NOT_ALLOW)
      return res.status(400).json(result.body);
    if (result.type === RESPONSE.USER.NOT_FOUND)
      return res.status(404).json(result.body);
    if (result.type === RESPONSE.DOCUMENTS.ALREADY_EXIST)
      return res.status(409).json(result.body);
  } catch (err) {
    console.error("uploadDocument error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
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

    if (result.type === RESPONSE.DOCUMENTS.UPLOAD) {
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
    if (result.type === RESPONSE.DOCUMENTS.NOT_ALLOW)
      return res.status(400).json(result.body);
    if (result.type === RESPONSE.USER.NOT_FOUND)
      return res.status(404).json(result.body);
    if (result.type === RESPONSE.DOCUMENTS.NOT_FOUND)
      return res.status(404).json(result.body);
  } catch (err) {
    console.error("updateDocument error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

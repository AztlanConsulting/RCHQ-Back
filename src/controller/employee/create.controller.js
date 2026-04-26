// controller/employee/employeeAdd.controller.js
const {
  createEmployee,
  uploadDocument,
  updateDocument,
} = require("../../service/employee/create.service");
const { RESPONSE } = require("../../utils/response");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");

exports.postAdd = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      data.picture = req.file.path;
    }

    const result = await createEmployee(data, req.user, req);

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "No se pudo registrar correctamente el empleado",
    });
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
          id,
          getClientIp(req),
        );
      } catch (err) {
        console.error("Error creando log:", err);
      }
      return res.status(201).json(result.body);
    }

    if (result.type === RESPONSE.DOCUMENTS.NOT_ALLOW) {
      return res.status(400).json(result.body);
    }

    if (result.type === RESPONSE.USER.NOT_FOUND) {
      return res.status(404).json(result.body);
    }
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
          id,
          getClientIp(req),
        );
      } catch (err) {
        console.error("Error creando log:", err);
      }
      return res.status(200).json(result.body);
    }

    if (result.type === RESPONSE.DOCUMENTS.NOT_ALLOW) {
      return res.status(400).json(result.body);
    }

    if (result.type === RESPONSE.USER.NOT_FOUND) {
      return res.status(404).json(result.body);
    }

    if (result.type === RESPONSE.DOCUMENTS.NOT_FOUND) {
      return res.status(404).json(result.body);
    }
  } catch (err) {
    console.error("updateDocument error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

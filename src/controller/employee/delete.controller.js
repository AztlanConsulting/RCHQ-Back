const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");
const { deleteDocument } = require("../../service/employee/delete.service");
const RESPONSES = require("../../utils/responses");

exports.deleteDocument = async (req, res) => {
  try {
    const { id, field } = req.params;
    if (!id || !field) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan campos requeridos" });
    }

    const result = await deleteDocument(id, field);

    if (result.type === RESPONSES.DOCUMENTS.DELETE) {
      try {
        await createLog(
          req.user.id,
          LOG_ACTIONS.DOCUMENT_DELETED,
          getClientIp(req),
          id,
        );
      } catch (err) {
        console.error("Error creando log:", err);
      }
      return res.status(200).json(result.body);
    }

    if (result.type === RESPONSES.DOCUMENTS.NOT_ALLOW) {
      return res.status(400).json(result.body);
    }

    if (result.type === RESPONSES.USER.NOT_FOUND) {
      return res.status(404).json(result.body);
    }

    if (result.type === RESPONSES.DOCUMENTS.NOT_FOUND) {
      return res.status(404).json(result.body);
    }
  } catch (err) {
    console.error("deleteDocument error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error del servidor" });
  }
};

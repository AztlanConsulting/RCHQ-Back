const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");
const { deleteDocument } = require("../../service/employee/delete.service");
const { RESPONSE } = require("../../utils/response");

exports.deleteDocument = async (req, res) => {
  try {
    const { id, field } = req.params;
    if (!id || !field) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan campos requeridos" });
    }

    const result = await deleteDocument(id, field);

    if (result.type === RESPONSE.DOCUMENTS.DELETE) {
      try {
        await createLog(
          req.user.id,
          LOG_ACTIONS.DOCUMENT_DELETED,
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
    console.error("deleteDocument error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error del servidor" });
  }
};

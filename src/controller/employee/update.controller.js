const {updateDocument } = require("../../service/employee/update.service");
const RESPONSES = require("../../utils/responses");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");

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

    if (result.type === RESPONSES.DOCUMENTS.UPLOAD) {
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

// controller/employee/employeeDelete.controller.js

const {
  deleteDocument,
} = require("../../service/employee/employeeDelete.service");

exports.deleteDocument = async (req, res) => {
  try {
    const { id, field } = req.params;

    if (!id || !field) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan campos requeridos" });
    }

    const result = await deleteDocument(id, field, req.user, req);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("deleteDocument error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

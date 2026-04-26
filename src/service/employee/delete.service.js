//service/employee/employeeDelete.service.js
const { clearDocumentField } = require("../../model/employee/delete.model");
const {
  findById,
  findDocumentRowByEmployee,
} = require("../../model/employee/read.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");
const { VALID_DOCUMENT_FIELDS } = require("../../middleware/uploadDocs");
const fs = require("fs");

const validateField = (field) => VALID_DOCUMENT_FIELDS.includes(field);

exports.deleteDocument = async (employeeId, documentField, user, req) => {
  if (!validateField(documentField)) {
    return {
      status: 400,
      body: {
        success: false,
        message: `Tipo de documento inválido: ${documentField}`,
      },
    };
  }

  const employee = await findById(employeeId);
  if (!employee) {
    return {
      status: 404,
      body: { success: false, message: "Employee not found" },
    };
  }

  const docRow = await findDocumentRowByEmployee(employeeId);
  if (!docRow) {
    return {
      status: 404,
      body: { success: false, message: "El empleado no tiene documentos" },
    };
  }

  const currentUrl = docRow.documents?.[documentField];
  if (currentUrl) {
    try {
      fs.unlinkSync(currentUrl);
    } catch (err) {
      console.error("delete error: ", err);
    }
  }

  await clearDocumentField(docRow.document_id, employeeId, documentField);

  try {
    await createLog(
      user.id,
      LOG_ACTIONS.DOCUMENT_DELETED,
      employeeId,
      getClientIp(req),
    );
  } catch (err) {
    console.error("Error creando log:", err);
  }

  return {
    status: 200,
    body: { success: true, message: "Documento eliminado correctamente" },
  };
};

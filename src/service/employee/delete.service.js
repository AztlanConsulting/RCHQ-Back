//service/employee/employeeDelete.service.js
const { clearDocumentField } = require("../../model/employee/delete.model");
const {
  findById,
  findDocumentRowByEmployee,
} = require("../../model/employee/get.model");
const { VALID_DOCUMENT_FIELDS } = require("../../middleware/uploadDocs");
const RESPONSES = require("../../utils/responses");
const fs = require("fs");

const validateField = (field) => VALID_DOCUMENT_FIELDS.includes(field);

exports.deleteDocument = async (employeeId, documentField) => {
  if (!validateField(documentField)) {
    return {
      type: RESPONSES.DOCUMENTS.NOT_ALLOW,
      body: {
        success: false,
        message: `Tipo de documento inválido: ${documentField}`,
      },
    };
  }

  const employee = await findById(employeeId);
  if (!employee) {
    return {
      type: RESPONSES.USER.NOT_FOUND,
      body: { success: false, message: "Empleado no encontrado" },
    };
  }

  const docRow = await findDocumentRowByEmployee(employeeId);
  if (!docRow) {
    return {
      type: RESPONSES.DOCUMENTS.NOT_FOUND,
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

  return {
    type: RESPONSES.DOCUMENTS.DELETE,
    body: { success: true, message: "Documento eliminado correctamente" },
  };
};

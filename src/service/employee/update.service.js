const { deleteFileIfExists } = require("../../utils/deleteFile");
const {
  findDocumentById,
  findEmployeeDocument,
} = require("../../model/employee/get.model");
const {
  updateEmployeeDocument,
} = require("../../model/employee/update.model");
const { findById } = require("../../model/employee/get.model");
const RESPONSES = require("../../utils/responses");

exports.updateDocument = async (employeeId, documentId, file) => {
  const docType = await findDocumentById(documentId);
  if (!docType) {
    deleteFileIfExists(file?.path);
    return {
      type: RESPONSES.DOCUMENTS.NOT_ALLOW,
      body: { success: false, message: "Tipo de documento inválido" },
    };
  }

  const employee = await findById(employeeId);
  if (!employee) {
    deleteFileIfExists(file?.path);
    return {
      type: RESPONSES.USER.NOT_FOUND,
      body: { success: false, message: "Usuario no encontrado" },
    };
  }

  const existing = await findEmployeeDocument(employeeId, documentId);
  if (!existing) {
    deleteFileIfExists(file?.path);
    return {
      type: RESPONSES.DOCUMENTS.NOT_FOUND,
      body: { success: false, message: "No se encontró documento del empleado" },
    };
  }

  const fileUrl = `uploads/documents/${file.filename}`;
  try {
    const updated = await updateEmployeeDocument(employeeId, documentId, fileUrl);
    if (existing.url) deleteFileIfExists(existing.url);
    return {
      type: RESPONSES.DOCUMENTS.UPLOAD,
      body: { success: true, data: updated },
    };
  } catch (err) {
    deleteFileIfExists(fileUrl);
    throw err;
  }
};
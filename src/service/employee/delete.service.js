const { deleteFileIfExists } = require("../../utils/deleteFile");
const { findEmployeeDocument } = require("../../model/employee/get.model");
const { deleteEmployeeDocument } = require("../../model/employee/delete.model");
const RESPONSES = require("../../utils/responses");

exports.deleteDocument = async (employeeId, documentId) => {
  const existing = await findEmployeeDocument(employeeId, documentId);
  if (!existing) {
    return {
      type: RESPONSES.DOCUMENTS.NOT_FOUND,
      body: { success: false, message: "Documento no encontrado" },
    };
  }
  try {
    await deleteEmployeeDocument(employeeId, documentId);
    if (existing.url) deleteFileIfExists(existing.url);
    return {
      type: RESPONSES.DOCUMENTS.DELETED,
      body: { success: true },
    };
  } catch (err) {
    console.error("Error deleting document:", err);
    throw err;
  }
};
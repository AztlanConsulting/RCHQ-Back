//service/employee/employeeGet.service.js

const {
  findById,
  findByCurp,
  getAllRoles,
  getDocumentsByEmployee,
  findDocumentRowByEmployee,
} = require("../../model/employee/read.model");
const { createDocumentRow } = require("../../model/employee/create.model");

exports.getById = async (id) => {
  return await findById(id);
};

exports.getRoles = async () => {
  return await getAllRoles();
};

exports.getDocumentsByEmployee = async (employeeId) => {
  const employee = await findById(employeeId);
  if (!employee) {
    return {
      status: 404,
      body: { success: false, message: "Employee not found" },
    };
  }

  const docRow = await findDocumentRowByEmployee(employeeId);
  if (!docRow) {
    return { status: 200, body: { success: true, data: null } };
  }

  return { status: 200, body: { success: true, data: docRow } };
};

exports.getOrCreateDocRow = async (employeeId) => {
  let docRow = await findDocumentRowByEmployee(employeeId);
  if (!docRow) {
    const newDoc = await createDocumentRow(employeeId);
    return { document_id: newDoc.document_id };
  }
  return { document_id: docRow.document_id };
};

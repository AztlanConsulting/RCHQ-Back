const {
  findById,
  getAllRoles,
  findDocumentRowByEmployee,
} = require("../../model/employee/read.model");
const { createDocumentRow } = require("../../model/employee/create.model");
const { RESPONSE } = require("../../utils/response");

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
      type: RESPONSE.USER.NOT_FOUND,
      data: null,
    };
  }

  const docRow = await findDocumentRowByEmployee(employeeId);

  if (!docRow) {
    return {
      type: RESPONSE.DOCUMENT.NOT_FOUND,
      data: null,
    };
  }

  return {
    type: RESPONSE.DOCUMENT.OK,
    data: docRow,
  };
};

exports.getOrCreateDocRow = async (employeeId) => {
  let docRow = await findDocumentRowByEmployee(employeeId);
  if (!docRow) {
    const newDoc = await createDocumentRow(employeeId);
    return { document_id: newDoc.document_id };
  }
  return { document_id: docRow.document_id };
};

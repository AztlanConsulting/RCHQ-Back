const {
  findById,
  getAllRoles,
  findDocumentRowByEmployee,
} = require("../../model/employee/get.model");
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
      body: null,
    };
  }

  const docRow = await findDocumentRowByEmployee(employeeId);

  if (!docRow) {
    return {
      type: RESPONSE.DOCUMENTS.NOT_FOUND,
      body: null,
    };
  }

  return {
    type: RESPONSE.DOCUMENTS.OK,
    body: docRow,
  };
};

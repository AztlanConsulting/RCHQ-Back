const {
  findById,
  getAllRoles,
  findDocumentRowByEmployee,
  getEmployees,
} = require("../../model/employee/get.model");
const RESPONSES = require("../../utils/responses");

exports.getEmployees = async (
  houseId,
  activeQuery,
  pageQuery,
  limitQuery,
  searchQuery,
) => {
  const active = activeQuery === "false" ? false : true;

  const page = Number(pageQuery) > 0 ? Number(pageQuery) : 1;
  const limit = Number(limitQuery) > 0 ? Number(limitQuery) : 6;

  const skip = (page - 1) * limit;
  const search = searchQuery?.trim() || "";

  const { employees, total } = await getEmployees(
    houseId,
    active,
    search,
    skip,
    limit,
  );

  const totalPages = Math.ceil(total / limit);

  return {
    data: employees.map((employee) => ({
      employeeId: employee.employeeId,
      fullName: `${employee.name} ${employee.surname}`,
      role: employee.roleName,
      picture: employee.picture,
      status: employee.isActive,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

exports.getById = async (id) => {
  return await findById(id);
};

exports.getRoles = async () => {
  return await getAllRoles();
};

exports.getDocumentsByEmployee = async (employeeId) => {
  const employee = await findById(employeeId);

  if (!employee) {
    return { type: RESPONSES.USER.NOT_FOUND, body: null };
  }

  const docRow = await findDocumentRowByEmployee(employeeId);

  if (!docRow) {
    return { type: RESPONSES.DOCUMENTS.NOT_FOUND, body: null };
  }

  return { type: RESPONSES.DOCUMENTS.OK, body: docRow };
};

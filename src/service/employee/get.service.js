const {
  findById,
  getAllRoles,
  findDocumentRowByEmployee,
  getEmployees,
  getEmployeeById,
  getEmployeeAddress,
  getHouseByEmployeeId,
  getAdminEmployeeInfoById,
  getEmployeeRecord,
} = require("../../model/employee/get.model");
const { decryptValue } = require("../../utils/password");
// const personnel = require("../model/personnel.model");
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


exports.getEmployeeDetail = async (userID, employeeID) => {
  // get basic employee info
  const employeeBasicInfo = await getEmployeeById(employeeID);

  // Return 400 Bad request if there is no employee id to lookup
  if (!userID || !employeeID) {
    return {
      code: RESPONSES.personnel.badRequest,
    };
  }

  // If the employee whose detail we want to see doesn't exist,
  // return 404 Not Found
  if (!employeeBasicInfo) {
    return {
      code: RESPONSES.personnel.notFound,
    };
  }

  const decryptedSalary = parseInt(decryptValue(employeeBasicInfo.salary));

  if (decryptedSalary) {
    employeeBasicInfo.salary = decryptedSalary;
  }

  const employeeAddress = await getEmployeeAddress(employeeID);
  if (employeeAddress) {
    employeeBasicInfo.address = employeeAddress;
  }

  const house = await getHouseByEmployeeId(employeeID);
  if (house) {
    employeeBasicInfo.house = house;
  }

  // get administrativeEmployeeInfo
  const employeeAdminInfo =
    await getAdminEmployeeInfoById(employeeID);

  // get employee record
  const employeeRecord = await getEmployeeRecord(employeeID);

  return {
    code: RESPONSES.personnel.found,
    data: {
      employee: {
        basicInfo: employeeBasicInfo,
        adminInfo: employeeAdminInfo,
        record: employeeRecord,
      },
    },
  };
};

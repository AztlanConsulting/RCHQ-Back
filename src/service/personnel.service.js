const Personnel = require("../model/personnel.model");
const { getClientIp } = require("../utils/ip");
const responses = require("../utils/responses");
const { decryptValue } = require("../utils/password");

exports.getEmployeeDetail = async (userID, employeeID) => {
  // get basic employee info
  const employeeBasicInfo = await Personnel.getEmployeeById(employeeID);

  const decryptedSalary = parseInt(decryptValue(employeeBasicInfo.salary));

  if (decryptedSalary) {
    employeeBasicInfo.salary = decryptedSalary;
  }

  // If the employee whose detail we want to see doesn't exist,
  // return 404 Not Found
  if (!employeeBasicInfo) {
    return {
      code: responses.personnel.notFound,
    };
  }

  const employeeAddress = await Personnel.getEmployeeAddress(employeeID);
  if (employeeAddress) {
    employeeBasicInfo.address = employeeAddress;
  }

  const house = await Personnel.getHouseByEmployeeId(employeeID);
  if (house) {
    employeeBasicInfo.house = house;
  }

  // get administrativeEmployeeInfo
  const employeeAdminInfo =
    await Personnel.getAdminEmployeeInfoById(employeeID);

  // get employee record
  const employeeRecord = await Personnel.getEmployeeRecord(employeeID);

  return {
    code: responses.personnel.found,
    data: {
      employee: {
        basicInfo: employeeBasicInfo,
        adminInfo: employeeAdminInfo,
        record: employeeRecord,
      },
    },
  }
};

const personnel = require("../model/personnel.model");
const responses = require("../utils/responses");
const { decryptValue } = require("../utils/password");

exports.getEmployeeDetail = async (userID, employeeID) => {
  // get basic employee info
  const employeeBasicInfo = await personnel.getEmployeeById(employeeID);

  // If the employee whose detail we want to see doesn't exist,
  // return 404 Not Found
  if (!employeeBasicInfo) {
    return {
      code: responses.personnel.notFound,
    };
  }

  const decryptedSalary = parseInt(decryptValue(employeeBasicInfo.salary));

  if (decryptedSalary) {
    employeeBasicInfo.salary = decryptedSalary;
  }

  const employeeAddress = await personnel.getEmployeeAddress(employeeID);
  if (employeeAddress) {
    employeeBasicInfo.address = employeeAddress;
  }

  const house = await personnel.getHouseByEmployeeId(employeeID);
  if (house) {
    employeeBasicInfo.house = house;
  }

  // get administrativeEmployeeInfo
  const employeeAdminInfo =
    await personnel.getAdminEmployeeInfoById(employeeID);

  // get employee record
  const employeeRecord = await personnel.getEmployeeRecord(employeeID);

  return {
    code: responses.personnel.found,
    data: {
      employee: {
        basicInfo: employeeBasicInfo,
        adminInfo: employeeAdminInfo,
        record: employeeRecord,
      },
    },
  };
};

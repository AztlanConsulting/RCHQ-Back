const Personnel = require("../model/personnel.model");
const { getClientIp } = require("../utils/ip");
const { createLog } = require("../model/log.model");
const { LOG_ACTIONS } = require("../utils/logActions");

async function getEmployeeDetail(req) {
    const userID = req.user.id;
    const { employeeID } = req.params;
    const ipAddress = getClientIp(req);

    // Return 400 Bad request if there is no employee id to lookup
    if (!employeeID) {
        return {
            status: 400,
            body: {
                success: false,
                code: "Bad Request",
                message: "Incomplete body for this request",
            }
        }
    }

    // get basic employee info
    const employeeBasicInfo = await Personnel.getEmployeeById(employeeID);

    // If the employee whose detail we want to see doesn't exist,
    // return 404 Not Found
    if (!employeeBasicInfo) {
        return {
            status: 404,
            body: {
                success: false,
                code: "Not Found",
                message: "User with given ID not found",
              },
        }
    }

    const house = await Personnel.getHouseByEmployeeId(employeeID);
    if (house) {
        employeeBasicInfo.house = house;
    }
    console.log("basic info: ", employeeBasicInfo);

    // get administrativeEmployeeInfo
    const employeeAdminInfo = await Personnel.getAdminEmployeeInfoById(employeeID);
    console.log("admin info: ", employeeAdminInfo);

    // get employee record
    const employeeRecord = await Personnel.getEmployeeRecord(employeeID);
    console.log("record: ", employeeRecord);

    // create log of get-employee-detail
    // deberiamos wrappear esto en un try/catch??
    await createLog(
        userID,
        LOG_ACTIONS.READ_EMPLOYEE_DETAIL,
        ipAddress,
    );

    // return data payload
    return result = {
        status: 200,
        body: {
            success: true,
            code: "",
            message: "",
            data: {
                employee: {
                    basicInfo: employeeBasicInfo,
                    adminInfo: employeeAdminInfo,
                    record: employeeRecord,
                }
            }
        },
    }
}

module.exports = {
  getEmployeeDetail
};

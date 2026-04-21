const employeeModel = require("../../model/employee/consult.model.js");

exports.getDocumentsByEmployee = async (employeeId) => {

    const employee = await employeeModel.findById(employeeId);

    if (!employee) {
      return {
        status: 404,
        body: {
          success: false,
          message: "Employee not found",
        },
      };
    }

    const documents = await employeeModel.getDocumentsByEmployee(employeeId);

    return {
      status: 200,
      body: {
        success: true,
        data: documents,
      },
    };
};



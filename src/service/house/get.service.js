const {
    getHouseEmployeesByEmployeeId,
    getHouseNameByEmployeeId,
} = require("../../model/house/get.model");
const RESPONSES = require("../../utils/responses");

exports.getHouseNameForEmployee = async (employeeId) => {
    if (!employeeId) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_PROVIDED,
        };
    }

    const name = await getHouseNameByEmployeeId(employeeId);

    if (name === null) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    return {
        code: RESPONSES.EMPLOYEE.FOUND,
        data: { houseName: name },
    };
};

exports.getHouseEmployeesForEmployee = async (employeeId) => {
    if (!employeeId) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_PROVIDED,
        };
    }

    const employees = await getHouseEmployeesByEmployeeId(employeeId);

    if (employees === null) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    return {
        code: RESPONSES.EMPLOYEE.FOUND,
        data: {
            employees: employees.map((employee) => ({
                employeeId: employee.employee_id,
                name: employee.name,
                curp: employee.curp,
                isActive: employee.is_active,
            })),
        },
    };
};

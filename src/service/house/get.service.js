const { getHouseNameByEmployeeId } = require("../../model/house/get.model");
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

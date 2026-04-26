const { getEmployees } = require("../../model/employee/getAll.model");

const getEmployeesService = async (houseId, activeQuery) => {
    let active = true;

    if (activeQuery !== undefined) {
        active = activeQuery === "true";
    }

    const employees = await getEmployees(houseId, active);

    return employees.map((employee) => ({
        employeeId: employee.employeeId,
        fullName: `${employee.name} ${employee.surname}`,
        role: employee.roleName,
        picture: employee.picture,
        status: employee.isActive,
    }));
};

module.exports = {
    getEmployeesService,
};

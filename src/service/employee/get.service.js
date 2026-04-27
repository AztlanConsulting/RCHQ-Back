const { getEmployees } = require("../../model/employee/get.model");

exports.getEmployeesService = async (
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

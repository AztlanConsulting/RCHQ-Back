const prisma = require("../../prisma");

const getEmployees = async (houseId, active, skip, take) => {
    const [employees, total] = await Promise.all([
        prisma.employee.findMany({
            where: {
                house_id: houseId,
                is_active: active,
            },
            select: {
                employee_id: true,
                name: true,
                surname: true,
                picture: true,
                is_active: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
            skip,
            take,
        }),

        prisma.employee.count({
            where: {
                house_id: houseId,
                is_active: active,
            },
        }),
    ]);

    return {
        employees: employees.map((employee) => ({
            employeeId: employee.employee_id,
            name: employee.name,
            surname: employee.surname,
            picture: employee.picture,
            isActive: employee.is_active,
            roleName: employee.role.name,
        })),
        total,
    };
};

module.exports = {
    getEmployees,
};

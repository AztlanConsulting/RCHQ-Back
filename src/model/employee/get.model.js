const prisma = require("../../prisma");

exports.getEmployees = async (houseId, active, search, skip, take) => {
    const where = {
        house_id: houseId,
        is_active: active,
    };

    if (search) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                surname: {
                    contains: search,
                    mode: "insensitive",
                },
            },
        ];
    }

    const [employees, total] = await Promise.all([
        prisma.employee.findMany({
            where,
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

        prisma.employee.count({ where }),
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

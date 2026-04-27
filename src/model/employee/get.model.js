//model/employee/employeeGet.model.js
const prisma = require("../../prisma");

exports.findByCurp = async (curp) => {
  return await prisma.employee.findUnique({
    where: { curp },
  });
};

exports.findById = async (employee_id) => {
  return await prisma.employee.findUnique({
    where: { employee_id },
  });
};

exports.getAllRoles = async () => {
    const roles = await prisma.role.findMany();

    return roles.map((role) => ({
        roleId: role.role_id,
        name: role.name,
    }));
};

exports.getDocumentsByEmployee = async (employeeId) => {
  return await prisma.employee_documents.findMany({
    where: { employee_id: employeeId },
    include: {
      documents: true,
    },
  });
};

exports.findDocumentRowByEmployee = async (employee_id) => {
  return await prisma.employee_documents.findFirst({
    where: { employee_id },
    include: { documents: true },
  });
};

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
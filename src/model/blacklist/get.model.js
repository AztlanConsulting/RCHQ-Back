const prisma = require("../../prisma");

exports.findEmployeeById = async (employeeId) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { employee_id: employeeId },
            select: {
                employee_id: true,
                name: true,
                surname: true,
                curp: true,
                is_active: true,
            },
        });

        if (!employee) return null;

        return {
            employeeId: employee.employee_id,
            name: employee.name,
            surname: employee.surname,
            curp: employee.curp,
            isActive: employee.is_active,
        };
    } catch {
        return null;
    }
};
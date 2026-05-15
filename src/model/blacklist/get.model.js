const prisma = require("../../prisma");

exports.findEmployeeByCurp = async (curp) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { curp: curp },
            select: {
                name: true,
                surname: true,
                curp: true,
                is_active: true,
            },
        });

        if (!employee) return null;

        return {
            name: employee.name,
            surname: employee.surname,
            curp: employee.curp,
            isActive: employee.is_active,
        };
    } catch {
        return null;
    }
};
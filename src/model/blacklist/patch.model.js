const prisma = require("../../prisma");

exports.deactivateEmployee = async (employeeId) => {
    try {
        await prisma.employee.update({
            where: { employee_id: employeeId },
            data: { is_active: false },
        });

        return true;
    } catch {
        return null;
    }
};
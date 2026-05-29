const prisma = require("../../prisma");
const { mapEmployee } = require("../../utils/mappers/employee.map");

exports.getEmployeeToDeactivate = async (employeeId) => {
    const employee = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        include: {
            blacklist: true,
        },
    });

    if (!employee) return null;
    
    return mapEmployee(employee);
};

exports.deactivateEmployee = async (employeeId, reason, curpToBlacklist = null, wasActive = true) => {
    const actions = [];

    if (wasActive) {
        actions.push(
            prisma.employee.update({
                where: { employee_id: employeeId },
                data: {
                    is_active: false,
                    end_date: new Date(),
                    deactivation_reason: reason,
                },
            })
        );
    }

    if (curpToBlacklist) {
        actions.push(
            prisma.blacklist.upsert({
                where: { curp: curpToBlacklist },
                update: {},
                create: { 
                    curp: curpToBlacklist,
                    reason: reason 
                },
            })
        );
    }

    if (actions.length > 0) {
        await prisma.$transaction(actions);
    }
};

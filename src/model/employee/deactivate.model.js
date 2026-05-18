const prisma = require("../../prisma");

exports.getEmployeeToDeactivate = async (employeeId) => {
    const employee = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        select: {
            employee_id: true,
            name: true,
            surname: true,
            house_id: true,
            curp: true,
            is_active: true,
            blacklist: true,
        },
    });

    if (!employee) return null;

    return {
        employeeId: employee.employee_id,
        name: employee.name,
        surname: employee.surname,
        houseId: employee.house_id,
        curp: employee.curp,
        isActive: employee.is_active,
        isBlacklisted: !!employee.blacklist,
    };
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
                create: { curp: curpToBlacklist },
            })
        );
    }

    if (actions.length > 0) {
        await prisma.$transaction(actions);
    }
};

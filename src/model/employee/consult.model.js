const prisma = require("../../prisma");

async function findByCurp(curp) {
    return await prisma.employee.findUnique({
        where: { curp },
    });
}

async function findById(employee_id) {
    return await prisma.employee.findUnique({
        where: { employee_id: employee_id },
    });
}

async function getAllRoles() {
    const roles = await prisma.role.findMany();

    return roles.map((role) => ({
        roleId: role.role_id,
        name: role.name,
    }));
}

module.exports = {
    findByCurp,
    findById,
    getAllRoles,
};

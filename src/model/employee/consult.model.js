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
    return await prisma.role.findMany();
}

module.exports = {
    findByCurp,
    findById,
    getAllRoles,
};

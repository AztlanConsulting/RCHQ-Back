const prisma = require("../../prisma");

const consult = {
    async findByCurp(curp) {
        return await prisma.employee.findUnique({
            where: { curp },
        });
    },

    async findById(employee_id) {
        return await prisma.employee.findUnique({
            where: { employee_id },
        });
    },

    async getAllRoles() {
        return await prisma.role.findMany();
    },
};

module.exports = consult;

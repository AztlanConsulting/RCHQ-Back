const prisma = require("../../prisma");

exports.findByCurp = async (curp) => {
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

async function getWorkDays(employeeId) {
    return await prisma.employee_workday.findMany({
        where: {
            employee_id: employeeId
        },
        include: {
            workday: true
        }
    });
}

async function getHome(employeeId) {
    return await prisma.employee.findUnique({
        where: {
            employee_id: employeeId
        },
        select: {
            house_id: true
        }
    });
}

async function getStartDate(employeeId) {
    return await prisma.employee.findUnique({
        where: {
            employee_id: employeeId
        },
        select: {
            start_date: true
        }
    });
}

module.exports = {
    findById,
    getAllRoles,
    getWorkDays,
    getHome,
    getStartDate
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

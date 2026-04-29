const prisma = require("../../prisma");

exports.findByCurp = async (curp) => {
    return await prisma.employee.findUnique({
        where: { curp },
    });
}

// Estas funciones están declaradas dos veces, comenté estas para
// usar las segundas, pero falta aclarar cuales son las correctas
// async function findById(employee_id) {
//     return await prisma.employee.findUnique({
//         where: { employee_id: employee_id },
//     });
// }

// async function getAllRoles() {
//     return await prisma.role.findMany();
// }

exports.getWorkDays = async (employeeId) => {
    return await prisma.employee_workday.findMany({
        where: {
            employee_id: employeeId
        },
        include: {
            workday: true
        }
    });
}

exports.getHome = async (employeeId) => {
    return await prisma.employee.findUnique({
        where: {
            employee_id: employeeId
        },
        select: {
            house_id: true
        }
    });
}

exports.getStartDate = async (employeeId) => {
    return await prisma.employee.findUnique({
        where: {
            employee_id: employeeId
        },
        select: {
            start_date: true
        }
    });
}

exports.findById = async (employeeId) => {
    return await prisma.employee.findUnique({
        where: { employee_id: employeeId },
    });
};

exports.getAllRoles = async () => {
    const roles = await prisma.role.findMany();

    return roles.map((role) => ({
        roleId: role.role_id,
        name: role.name,
    }));
};

exports.findByIdWithRoleAndHouse = async (employeeId) => {
    return await prisma.employee.findUnique({
        where: {
            employee_id: employeeId,
        },
        include: {
            role: true,
            house: true,
        },
    });
}

const prisma = require("../../prisma");

async function create(employeeData) {
    const data = {
        employee_id: employeeData.employee_id,
        house_id: employeeData.house_id,
        role_id: employeeData.role_id,
        name: employeeData.name,
        surname: employeeData.surname,
        is_active: employeeData.is_active,
        email: employeeData.email,
        password: employeeData.password,
        has_first_login: employeeData.has_first_login,
        totp_secret: employeeData.totp_secret,
        curp: employeeData.curp,
        rfc: employeeData.rfc || null,
        nss: employeeData.nss || null,
        bank_account: employeeData.bank_account || null,
        birth_date: employeeData.birth_date || null,
        picture: employeeData.picture || null,
        start_date: employeeData.start_date,
    };

    return await prisma.employee.create({ data });
}

module.exports = {
    create,
};

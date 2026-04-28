const prisma = require("../../prisma");

exports.findByCurp = async (curp) => {
  return await prisma.employee.findUnique({
    where: { curp },
  });
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

// src/model/profile.model.js
const prisma = require("../../prisma");
const { mapProfile } = require("../../utils/mappers/users.map");

exports.findEmployeeProfile = async (employeeId) => {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeId },
    select: {
      name: true,
      surname: true,
      email: true,
      rfc: true,
      curp: true,
      nss: true,
      bank_account: true,
      birth_date: true,
      picture: true,
      house: {
        select: { name: true },
      },
      role: {
        select: { name: true },
      },
    },
  });

  if (!employee) return null;

  return mapProfile(employee);
};

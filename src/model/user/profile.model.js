// src/model/profile.model.js
const prisma = require("../../prisma");

async function findEmployeeProfile(employeeId) {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeId },
    select: {
      name:         true,
      surname:      true,
      email:        true,
      rfc:          true,
      curp:         true,
      nss:          true,
      bank_account: true,
      birth_date:   true,
      picture:      true,
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
}

function mapProfile(e) {
  return {
    houseName:   e.house.name,
    roleName:    e.role.name,
    name:        e.name,
    surname:     e.surname,
    email:       e.email,
    rfc:         e.rfc,
    curp:        e.curp,
    nss:         e.nss,
    bankAccount: e.bank_account,
    birthDate:   e.birth_date,
    picture:     e.picture,
  };
}

module.exports = {
  findEmployeeProfile,
};
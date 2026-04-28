const { randomUUID } = require("crypto");
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
  };
};

exports.deactivateEmployee = async (employeeId) => {
  await prisma.employee.update({
    where: { employee_id: employeeId },
    data: {
      is_active: false,
      end_date: new Date(),
    },
  });
};

exports.insertIntoBlacklist = async (curp, name, surname, reason) => {
  await prisma.blacklist.create({
    data: {
      blacklist_id: randomUUID(),
      curp,
      name,
      surname,
      reason,
      created_at: new Date(),
    },
  });
};
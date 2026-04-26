//model/employee/employeeGet.model.js
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
  return await prisma.role.findMany();
};

exports.getDocumentsByEmployee = async (employeeId) => {
  return await prisma.employee_documents.findMany({
    where: { employee_id: employeeId },
    include: {
      documents: true,
    },
  });
};

exports.findDocumentRowByEmployee = async (employee_id) => {
  return await prisma.employee_documents.findFirst({
    where: { employee_id },
    include: { documents: true },
  });
};

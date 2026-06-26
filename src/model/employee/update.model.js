const prisma = require("../../prisma");
const { randomUUID } = require("crypto");
const {
  mapEmployeeBasicData,
  mapEmployeeContactData,
  mapEmployeeAdminData,
  mapAddressData,
} = require("../../utils/mappers/employee.map");


exports.updateBasicInfo = async (employeeId, body) => {
  const employeeData = mapEmployeeBasicData(body);
  if (Object.keys(employeeData).length === 0) return;

  await prisma.employee.update({
    where: { employee_id: employeeId },
    data: employeeData,
  });
};

exports.updateContactInfo = async (employeeId, body) => {
  const ops = [];

  const employeeData = mapEmployeeContactData(body);
  if (Object.keys(employeeData).length > 0) {
    ops.push(
      prisma.employee.update({
        where: { employee_id: employeeId },
        data: employeeData,
      })
    );
  }

  const addressData = mapAddressData(body);
  if (Object.keys(addressData).length > 0) {
    const existing = await prisma.employee_address.findFirst({
      where: { employee_id: employeeId },
    });

    if (existing) {
      ops.push(
        prisma.employee_address.update({
          where: { employee_address_id: existing.employee_address_id },
          data: { ...addressData, date: new Date() },
        })
      );
    } else {
      ops.push(
        prisma.employee_address.create({
          data: {
            employee_address_id: randomUUID(),
            employee_id: employeeId,
            url: "",
            date: new Date(),
            ...addressData,
          },
        })
      );
    }
  }

  if (ops.length > 0) await prisma.$transaction(ops);
};

exports.updateAdminInfo = async (employeeId, body) => {
  const employeeData = mapEmployeeAdminData(body);

  if (Object.keys(employeeData).length > 0) {
    await prisma.employee.update({
      where: { employee_id: employeeId },
      data: employeeData,
    });
  }
};

exports.upsertEmployeeShifts = async (employeeId, shifts) => {
  const { normalizeShiftInput } = require("../../utils/employeeShifts");

  await prisma.$transaction([
    prisma.employee_shift.deleteMany({
      where: { employee_id: employeeId },
    }),
    prisma.employee_shift.createMany({
      data: shifts.map((shift) => ({
        ...normalizeShiftInput(shift),
        employee_id: employeeId,
      })),
    }),
  ]);
};

exports.updateEmployeeDocument = async (employeeId, documentId, fileUrl) => {
    return await prisma.employee_documents.update({
        where: {
            document_id_employee_id: {
                document_id: documentId,
                employee_id: employeeId,
            },
        },
        data: { url: fileUrl },
    });
};

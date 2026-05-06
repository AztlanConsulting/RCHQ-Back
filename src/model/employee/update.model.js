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

exports.upsertWorkdays = async (employeeId, workdays) => {
  await prisma.$transaction([
    prisma.employee_workday.deleteMany({
      where: { employee_id: employeeId },
    }),
    prisma.employee_workday.createMany({
      data: workdays.map((w) => {
        const startDate = new Date(`1970-01-01T${w.start}:00Z`);
        let endDate = new Date(`1970-01-01T${w.end}:00Z`);
        if (endDate <= startDate) {
          endDate = new Date(`1970-01-02T${w.end}:00Z`);
        }
        return {
          workday_id:  w.workdayId,
          employee_id: employeeId,
          start: startDate,
          end:   endDate,
        };
      }),
    }),
  ]);
};

exports.getAllWorkdays = async () => {
  const workdays = await prisma.workday.findMany({ orderBy: { workday_id: "asc" } });
  return workdays.map((w) => ({ workdayId: w.workday_id, name: w.name }));
};

exports.getFrecuencyPaymentOptions = async () => {
  const options = await prisma.frecuency_of_payment.findMany({ orderBy: { frecuency_of_payment_id: "asc" } });
  return options.map((o) => ({ optionId: o.frecuency_of_payment_id, name: o.name }));
};

exports.getAllHouses = async () => {
  const houses = await prisma.house.findMany({ orderBy: { name: "asc" } });
  return houses.map((h) => ({
    houseId: h.house_id,
    name: h.name,
    location: h.location,
  }));
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

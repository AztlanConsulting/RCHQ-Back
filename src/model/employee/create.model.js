//model/employee/employeeAdd.model.js

const prisma = require("../../prisma");
const { v4: uuidv4 } = require("uuid");

exports.create = async (employeeData) => {
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
};

exports.createDocumentRowWithUrl = async (employeeId, field, fileUrl) => {
  return await prisma.$transaction(async (tx) => {
    const newDoc = await tx.documents.create({
      data: { document_id: uuidv4() },
    });
    await tx.employee_documents.create({
      data: { 
        document_id: newDoc.document_id, 
        employee_id: employeeId,
        [field]: fileUrl  // ← ya con la URL
      },
    });
    return newDoc;
  });
};

exports.updateDocumentField = async (
  document_id,
  employee_id,
  field,
  fileUrl,
) => {
  return await prisma.$transaction(async (tx) => {
    const updatedDoc = await tx.documents.update({
      where: { document_id },
      data: { [field]: fileUrl },
    });
    await tx.employee_documents.update({
      where: { document_id_employee_id: { document_id, employee_id } },
      data: { url: fileUrl },
    });
    return updatedDoc;
  });
};

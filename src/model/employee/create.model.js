const prisma = require("../../prisma");
const { v4: uuidv4 } = require("uuid");

exports.create = async (employeeData) => {
    const data = {
        employee_id: employeeData.employeeId,
        house_id: employeeData.houseId,
        role_id: employeeData.roleId,
        name: employeeData.name,
        surname: employeeData.surname,
        is_active: employeeData.isActive,
        email: employeeData.email,
        password: employeeData.password,
        has_first_login: employeeData.hasFirstLogin,
        totp_secret: employeeData.totpSecret,
        curp: employeeData.curp,
        rfc: employeeData.rfc || null,
        nss: employeeData.nss || null,
        bank_account: employeeData.bankAccount || null,
        birth_date: employeeData.birthDate || null,
        picture: employeeData.picture || null,
        start_date: employeeData.startDate,
    };

    const employee = await prisma.employee.create({ data });

    return {
        employeeId: employee.employee_id,
        houseId: employee.house_id,
        roleId: employee.role_id,
        name: employee.name,
        surname: employee.surname,
        isActive: employee.is_active,
        email: employee.email,
        hasFirstLogin: employee.has_first_login,
        totpSecret: employee.totp_secret,
        curp: employee.curp,
        rfc: employee.rfc,
        nss: employee.nss,
        bankAccount: employee.bank_account,
        birthDate: employee.birth_date,
        picture: employee.picture,
        startDate: employee.start_date,
    };
};

exports.createDocumentRowWithUrl = async (employeeId, field, fileUrl) => {
  return await prisma.$transaction(async (tx) => {
    const newDoc = await tx.documents.create({
      data: {
        document_id: uuidv4(),
        [field]: fileUrl,
      },
    });

    await tx.employee_documents.create({
      data: {
        document_id: newDoc.document_id,
        employee_id: employeeId,
        url: fileUrl,
      },
    });

    return newDoc;
  });
};

exports.updateDocumentField = async (
  documentId,
  employeeId,
  field,
  fileUrl,
) => {
  return await prisma.$transaction(async (tx) => {
    const updatedDoc = await tx.documents.update({
      where: { document_id: documentId },
      data: { [field]: fileUrl },
    });
    await tx.employee_documents.update({
      where: { document_id_employee_id: { documentId, employeeId } },
      data: { url: fileUrl },
    });
    return updatedDoc;
  });
};

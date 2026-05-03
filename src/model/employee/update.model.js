const prisma = require("../../prisma");

exports.updateEmployeeDocument = async (employeeId, documentId, fileUrl) => {
  return await prisma.employee_documents.update({
    where: {
      document_id_employee_id: { document_id: documentId, employee_id: employeeId },
    },
    data: { url: fileUrl },
  });
};
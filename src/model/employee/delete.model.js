const prisma = require("../../prisma");

exports.clearDocumentField = async (document_id, employee_id, field) => {
  return await prisma.$transaction(async (tx) => {
    const updatedDoc = await tx.documents.update({
      where: { document_id },
      data: { [field]: null },
    });
    await tx.employee_documents.update({
      where: { document_id_employee_id: { document_id, employee_id } },
      data: { url: "" },
    });
    return updatedDoc;
  });
};

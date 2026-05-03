const prisma = require("../../prisma");

exports.deleteEmployeeDocument = async (employeeId, documentId) => {
    return await prisma.employee_documents.delete({
        where: {
            document_id_employee_id: {
                document_id: documentId,
                employee_id: employeeId,
            },
        },
    });
};

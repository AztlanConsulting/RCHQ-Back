const {
  create,
  createDocumentRowWithUrl,
  updateDocumentField,
} = require("../../model/employee/create.model");
const {
  findById,
  findByCurp,
  getAllRoles,
  findDocumentRowByEmployee,
} = require("../../model/employee/get.model");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { hashPassword } = require("../../utils/password");
const {
  employeeCreateSchema,
} = require("../../schemas/employee/create.schemas");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { employeePolicy } = require("../../policies/employee.policies");
const { v4: uuidv4 } = require("uuid");
const { VALID_DOCUMENT_FIELDS } = require("../../middleware/uploadDocs");
const { RESPONSE } = require("../../utils/response");

const validateField = (field) => VALID_DOCUMENT_FIELDS.includes(field);

exports.getById = async (id) => {
    return await findById(id);
};

exports.getRoles = async () => {
    return await getAllRoles();
};

exports.createEmployee = async (employee, user, req) => {
    const validation = employeeCreateSchema.safeParse(employee);

    if (!validation.success) {
        return {
            success: false,
            type: "VALIDATION_ERROR",
            errors: validation.error.issues.map((error) => ({
                campo: error.path[0],
                mensaje: error.message,
            })),
        };
    }

    const data = validation.data;

    const canCreate = employeePolicy(user, {
        houseId: data.houseId,
    });

    if (!canCreate) {
        return {
            success: false,
            type: "FORBIDDEN",
            message: "Acceso denegado",
        };
    }

    const existingEmployee = await findByCurp(data.curp);

    if (existingEmployee) {
        return {
            success: false,
            type: "CONFLICT",
            message: "Empleado ya existente",
            employeeId: existingEmployee.employee_id,
        };
    }

    const hashedPassword = await hashPassword("red_de_casas_hogar");

    const newEmployee = await create({
        employeeId: uuidv4(),
        houseId: user.houseId,
        roleId: data.roleId,
        name: data.name,
        surname: data.surname,
        isActive: true,
        email: data.email,
        password: hashedPassword,
        hasFirstLogin: true,
        totpSecret: null,
        curp: data.curp,
        rfc: data.rfc,
        nss: data.nss,
        bankAccount: data.bankAccount,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        picture: data.picture,
        startDate: new Date(),
    });

    let warning = null;

    try {
        await createLog(
            user.id,
            LOG_ACTIONS.EMPLOYEE_CREATED,
            newEmployee.employeeId,
            getClientIp(req),
        );
    } catch (error) {
        console.error("Error creando log:", error);
        warning = "Empleado creado pero el log falló";
    }

    return {
        success: true,
        employeeId: newEmployee.employeeId,
        warning,
    };
};


exports.uploadDocument = async (employeeId, file, documentField) => {
  if (!validateField(documentField)) {
    return {
      type: RESPONSE.DOCUMENTS.NOT_ALLOW,
      body: {
        success: false,
        message: `Tipo de documento inválido: ${documentField}`,
      },
    };
  }

  const employee = await findById(employeeId);
  if (!employee) {
    return {
      type: RESPONSE.USER.NOT_FOUND,
      body: { success: false, message: "Usuario no encontrado" },
    };
  }

  const existingRow = await findDocumentRowByEmployee(employeeId);

  if (existingRow && existingRow.documents?.[documentField]) {
    return {
      type: RESPONSE.DOCUMENTS.ALREADY_EXIST,
      body: {
        success:false,
        message: "Este documento ya existe",
        field:documentField,
      },
    };
  }  
    const fileUrl = `uploads/documents/${file.filename}`;

    const resultDoc = existingRow
       ? await updateDocumentField(existingRow.document_id, employeeId, documentField, fileUrl)
       : await createDocumentRowWithUrl(employeeId, documentField, fileUrl);
  

  return {
    type: RESPONSE.DOCUMENTS.UPLOAD,
    body: { success: true, data: resultDoc },
  };
};

exports.updateDocument = async (employeeId, documentField, file) => {
  if (!validateField(documentField)) {
    return {
      type: RESPONSE.DOCUMENTS.NOT_ALLOW,
      body: {
        success: false,
        message: `Tipo de documento inválido: ${documentField}`,
      },
    };
  }

  const employee = await findById(employeeId);
  if (!employee) {
    return {
      type: RESPONSE.USER.NOT_FOUND,
      body: { success: false, message: "Usuario no encontrado" },
    };
  }

  const fileUrl = `uploads/documents/${file.filename}`;
  const existingRow = await findDocumentRowByEmployee(employeeId);

  if (!existingRow) {
    return {
      type: RESPONSE.DOCUMENTS.NOT_FOUND,
      body: {
        success: false,
        message: "No se encontró documento del empleado",
      },
    };
  }

  const updatedDoc = await updateDocumentField(
    existingRow.document_id,
    employeeId,
    documentField,
    fileUrl,
  );

  return {
    type: RESPONSE.DOCUMENTS.UPLOAD,
    body: { success: true, data: updatedDoc },
  };
};
//service/employee/employeeAdd.service.js

const {
  create,
  createDocumentRowWithUrl,
  updateDocumentField,
} = require("../../model/employee/create.model");
const {
  findById,
  findByCurp,
  findDocumentRowByEmployee,
} = require("../../model/employee/get.model");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { hashPassword } = require("../../utils/password");
const {
  employeeCreateSchema,
} = require("../../schemas/employee/employeeAdd.schemas");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { v4: uuidv4 } = require("uuid");
const { createEmployeePolicy } = require("../../policies/employeeAdd.policies");
const { VALID_DOCUMENT_FIELDS } = require("../../middleware/uploadDocs");
const { RESPONSE } = require("../../utils/response");

const validateField = (field) => VALID_DOCUMENT_FIELDS.includes(field);

exports.createEmployee = async (data, user, req) => {
  const result = employeeCreateSchema.safeParse(data);

  if (!result.success) {
    return {
      status: 400,
      body: {
        errors: result.error.issues.map((e) => ({
          campo: e.path[0],
          mensaje: e.message,
        })),
      },
    };
  }

  const validatedData = result.data;
  const resource = { house_id: validatedData.house_id };

  if (!createEmployeePolicy(user, resource)) {
    return {
      status: 403,
      body: { message: "Acceso Denegado" },
    };
  }

  const {
    role_id,
    name,
    surname,
    email,
    curp,
    rfc,
    nss,
    bank_account,
    birth_date,
    picture,
  } = validatedData;

  const existing = await findByCurp(curp);

  if (existing) {
    return {
      status: 409,
      body: {
        error: "Empleado ya existente",
        redirect: `/employee/${existing.employee_id}`,
      },
    };
  }

  const password = "red_de_casas_hogar";
  const hashedPassword = await hashPassword(password);

  const newEmployee = await create({
    employee_id: uuidv4(),
    house_id: user.houseId,
    role_id,
    name,
    surname,
    is_active: true,
    email,
    password: hashedPassword,
    has_first_login: true,
    totp_secret: null,
    curp,
    rfc,
    nss,
    bank_account,
    birth_date: birth_date ? new Date(birth_date) : null,
    picture: picture || null,
    start_date: new Date(),
  });

  const actorId = user?.id;
  let logError = null;

  try {
    await createLog(
      actorId,
      LOG_ACTIONS.EMPLOYEE_CREATED,
      newEmployee.employee_id,
      getClientIp(req),
    );
  } catch (error) {
    console.error("Error creando log:", error);
    logError = error;
  }

  return {
    status: 201,
    body: {
      message: "Empleado creado con éxito.",
      redirect: `/employee/${newEmployee.employee_id}`,
      warning: logError ? "Empleado creado pero el log falló" : null,
    },
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

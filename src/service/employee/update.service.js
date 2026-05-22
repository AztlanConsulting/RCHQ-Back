const {
  updateBasicInfo,
  updateContactInfo,
  updateAdminInfo,
  upsertWorkdays,
} = require("../../model/employee/update.model");
const { findById, getRoleById } = require("../../model/employee/get.model");
const { encryptValue } = require("../../utils/password");
const {
  employeeBasicUpdateSchema,
  employeeContactUpdateSchema,
  employeeAdminUpdateSchema,
} = require("../../schemas/employee/update.schemas");
const RESPONSES = require("../../utils/responses");
const { deleteFileIfExists } = require("../../utils/deleteFile");
const {
    findDocumentById,
    findEmployeeDocument,
} = require("../../model/employee/get.model");
const { updateEmployeeDocument } = require("../../model/employee/update.model");

const getMinutesFromTime = (timeValue) => {
  const [hours = 0, minutes = 0] = String(timeValue).split(":").map(Number);
  return hours * 60 + minutes;
};

exports.updateBasicInfoService = async ({ requesterId, employeeId, body }) => {
  if (!requesterId || !employeeId)
    return { type: RESPONSES.EMPLOYEE.BAD_REQUEST };

  const parsed = employeeBasicUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return {
      type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
      errors: parsed.error.issues.map((e) => ({ campo: e.path[0], mensaje: e.message })),
    };
  }

  const employee = await findById(employeeId);
  if (!employee) return { type: RESPONSES.EMPLOYEE.NOT_FOUND };

  await updateBasicInfo(employeeId, parsed.data);

  return { type: RESPONSES.EMPLOYEE.UPDATED };
};

exports.updateContactInfoService = async ({ requesterId, employeeId, body }) => {
  if (!requesterId || !employeeId)
    return { type: RESPONSES.EMPLOYEE.BAD_REQUEST };

  const parsed = employeeContactUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return {
      type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
      errors: parsed.error.issues.map((e) => ({ campo: e.path[0], mensaje: e.message })),
    };
  }

  const employee = await findById(employeeId);
  if (!employee) return { type: RESPONSES.EMPLOYEE.NOT_FOUND };

  await updateContactInfo(employeeId, parsed.data);

  return { type: RESPONSES.EMPLOYEE.UPDATED };
};

exports.updateAdminInfoService = async ({ requesterId, employeeId, body }) => {
  if (!requesterId || !employeeId)
    return { type: RESPONSES.EMPLOYEE.BAD_REQUEST };

  const parsed = employeeAdminUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return {
      type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
      errors: parsed.error.issues.map((e) => ({ campo: e.path[0], mensaje: e.message })),
    };
  }

  const employee = await findById(employeeId);
  if (!employee) return { type: RESPONSES.EMPLOYEE.NOT_FOUND };

  if (body.houseId !== undefined) {
    return {
      type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
      errors: [{
        campo: "houseId",
        mensaje: "La casa del empleado no se puede modificar desde esta sección",
      }],
    };
  }

  if (parsed.data.roleId) {
    const role = await getRoleById(parsed.data.roleId);

    if (!role) {
      return {
        type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
        errors: [{
          campo: "roleId",
          mensaje: "El puesto seleccionado no existe",
        }],
      };
    }

    if (role.name === "Administrador") {
      return {
        type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
        errors: [{
          campo: "roleId",
          mensaje: "No se puede modificar el puesto a Administrador",
        }],
      };
    }
  }

  const { workdays, salary, ...rest } = parsed.data;

  if (salary !== undefined && salary !== null) {
    if (salary === 0 || salary === "0") {
      rest.salary = "0"; 
    } else {
      rest.salary = encryptValue(String(salary));
    }
  }

  if (Object.keys(rest).length > 0) {
    await updateAdminInfo(employeeId, rest);
  }

  if (workdays && workdays.length > 0) {
    for (const workday of workdays) {
      const startMinutes = getMinutesFromTime(workday.start);
      const endMinutes = getMinutesFromTime(workday.end);
      const isOvernight = endMinutes <= startMinutes;
      const durationMinutes = isOvernight
        ? (24 * 60 - startMinutes) + endMinutes
        : endMinutes - startMinutes;

      if (durationMinutes < 60) {
        return {
          type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
          errors: [{
            campo: "workdays",
            mensaje: `El turno del día ${workday.workdayId} debe durar al menos 1 hora`,
          }],
        };
      }

      if (durationMinutes > 24 * 60) {
        return {
          type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
          errors: [{
            campo: "workdays",
            mensaje: `El turno del día ${workday.workdayId} no puede durar más de 24 horas`,
          }],
        };
      }
    }

    await upsertWorkdays(employeeId, workdays);
  }

  return { type: RESPONSES.EMPLOYEE.UPDATED };
};

exports.updateDocument = async (employeeId, documentId, file) => {
    const docType = await findDocumentById(documentId);
    if (!docType) {
        deleteFileIfExists(file?.path);
        return {
            type: RESPONSES.DOCUMENTS.NOT_ALLOW,
            body: { success: false, message: "Tipo de documento inválido" },
        };
    }

    const employee = await findById(employeeId);
    if (!employee) {
        deleteFileIfExists(file?.path);
        return {
            type: RESPONSES.USER.NOT_FOUND,
            body: { success: false, message: "Usuario no encontrado" },
        };
    }

    const existing = await findEmployeeDocument(employeeId, documentId);
    if (!existing) {
        deleteFileIfExists(file?.path);
        return {
            type: RESPONSES.DOCUMENTS.NOT_FOUND,
            body: {
                success: false,
                message: "No se encontró documento del empleado",
            },
        };
    }

    const fileUrl = `uploads/documents/${file.filename}`;
    try {
        const updated = await updateEmployeeDocument(
            employeeId,
            documentId,
            fileUrl,
        );
        if (existing.url) deleteFileIfExists(existing.url);
        return {
            type: RESPONSES.DOCUMENTS.UPLOADED,
            body: { success: true, data: updated },
        };
    } catch (err) {
        deleteFileIfExists(fileUrl);
        throw err;
    }
};

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
const { updateEmployeeDocument, reactivateEmployee } = require("../../model/employee/update.model");
const { getEmployeeToDeactivate } = require("../../model/employee/deactivate.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");

exports.updateBasicInfoService = async ({ requesterId, employeeId, body, file }) => {
  if (!requesterId || !employeeId)
    return { type: RESPONSES.EMPLOYEE.BAD_REQUEST };

  const hasBodyFields = body && Object.keys(body).length > 0;
  let parsedBody = {};

  if (hasBodyFields) {
    const parsed = employeeBasicUpdateSchema.safeParse(body);
    if (!parsed.success) {
      deleteFileIfExists(file?.path);
      return {
        type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
        errors: parsed.error.issues.map((e) => ({ campo: e.path[0], mensaje: e.message })),
      };
    }
    parsedBody = parsed.data;
  } else if (!file) {
    return {
      type: RESPONSES.EMPLOYEE.VALIDATION_ERROR,
      errors: [{
        campo: "body",
        mensaje: "Debe enviarse al menos un campo para actualizar",
      }],
    };
  }

  const employee = await findById(employeeId);
  if (!employee) {
    deleteFileIfExists(file?.path);
    return { type: RESPONSES.EMPLOYEE.NOT_FOUND };
  }

  const nextBasicInfo = {
    ...parsedBody,
    ...(file ? { picture: `uploads/${file.filename}` } : {}),
  };

  try {
    await updateBasicInfo(employeeId, nextBasicInfo);
    if (file && employee.picture && employee.picture !== nextBasicInfo.picture) {
      deleteFileIfExists(employee.picture);
    }
  } catch (error) {
    deleteFileIfExists(file?.path);
    throw error;
  }

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

exports.reactivateEmployeeService = async (req) => {
  const { employeeId } = req.params;
  const actorId = req.user.id;
  const ip = getClientIp(req);

  if (actorId === employeeId) {
      return { code: RESPONSES.EMPLOYEE.CANNOT_REACTIVATE_SELF };
  }

  const employee = req.resolvedEmployee || await getEmployeeToDeactivate(employeeId);

  if (!employee) {
    return { code: RESPONSES.EMPLOYEE.NOT_FOUND };
  }

  if (employee.isActive) {
      return { code: RESPONSES.EMPLOYEE.ALREADY_ACTIVE };
  }

  if (employee.isBlacklisted) {
      return { code: RESPONSES.EMPLOYEE.ALREADY_BLACKLISTED };
  }

  try {
      await reactivateEmployee(employeeId);
      
      try {
          await createLog(actorId, LOG_ACTIONS.EMPLOYEE_REACTIVATED, ip, employeeId);
      } catch (logError) {
          console.error("Reactivación exitosa pero falló el log de auditoría:", logError);
      }

      return {
          code: RESPONSES.EMPLOYEE.REACTIVATED,
          data: { name: employee.name },
      };
  } catch (error) {
      console.error("Error al reactivar al empleado:", error);
      return {
          code: RESPONSES.EMPLOYEE.REACTIVATION_FAILED,
          data: { name: employee.name },
      };
  }
};

const {
    create,
    createEmployeeDocument,
} = require("../../model/employee/create.model");
const { deleteFileIfExists } = require("../../utils/deleteFile");
const {
    findById,
    findByCurp,
    getAllRoles,
    findDocumentById,
    findEmployeeDocument,
} = require("../../model/employee/get.model");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { hashPassword } = require("../../utils/password");
const {
    employeeCreateSchema,
} = require("../../schemas/employee/create.schemas");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { employeePolicy } = require("../../policies/employee.policies");
const { randomUUID } = require("crypto");
const RESPONSES = require("../../utils/responses");

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

    const canCreate = employeePolicy(user, { houseId: data.houseId });

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
        employeeId: randomUUID(),
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

    return { success: true, employeeId: newEmployee.employeeId, warning };
};

exports.uploadDocument = async (employeeId, file, documentId) => {
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
    if (existing) {
        deleteFileIfExists(file?.path);
        return {
            type: RESPONSES.DOCUMENTS.ALREADY_EXIST,
            body: {
                success: false,
                message: "Este documento ya existe",
                field: documentId,
            },
        };
    }

    const fileUrl = `uploads/documents/${file.filename}`;
    try {
        const result = await createEmployeeDocument(
            employeeId,
            documentId,
            fileUrl,
        );
        return {
            type: RESPONSES.DOCUMENTS.UPLOAD,
            body: { success: true, data: result },
        };
    } catch (err) {
        deleteFileIfExists(fileUrl);
        throw err;
    }
};

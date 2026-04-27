const { create } = require("../../model/employee/create.model");
const {
    findById,
    findByCurp,
    getAllRoles,
} = require("../../model/employee/consult.model");

const { createLog } = require("../../model/log.model");

const { getClientIp } = require("../../utils/ip");
const { hashPassword } = require("../../utils/password");
const { LOG_ACTIONS } = require("../../utils/logActions");

const {
    employeeCreateSchema,
} = require("../../schemas/employee/create.schemas");

const { createEmployeePolicy } = require("../../policies/employeeAdd.policies");

const { v4: uuidv4 } = require("uuid");

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

    const canCreate = createEmployeePolicy(user, {
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

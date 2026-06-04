st { deleteFileIfExists } = require("../../utils/deleteFile");
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
    beneficiaryCreateSchema,
} = require("../../schemas/beneficiary/create.schema");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { employeePolicy } = require("../../policies/employee.policies");
const { randomUUID } = require("crypto");
const RESPONSES = require("../../utils/responses");
const { ROLES } = require("../../utils/roles");

exports.getById = async (id) => {
    return await findById(id);
};

exports.getRoles = async () => {
    const roles = await getAllRoles();
    return roles.filter((role) => role.name !== ROLES.ADMIN);
};

exports.registerBeneficiaryService = async (user, beneficiary, req) => {
    const validation = beneficiaryCreateSchema.safeParse(beneficiary);

    if (!validation.success) {
        return {
            code: RESPONSES.BENEFICIARY.BAD_REQUEST
        }
    }

    const {
        names,
        maternal_surname,
        paternal_surname,
        preferred_name,
        birth_date,
        blood_type,
        curp,
    } = beneficiary;

    // buscar niño dentro de la red por curp si es que se proporciono el curp
    // model/beneficiary/get.model.js searchBeneficiaryByCURP(curp)
    // searches beneficiary table for any matching curp
    // -> regresar id de casa del niño

    // buscar niño dentro de la red por otra info
    // model/beneficiary/get.model.js searchBeneficiaryByInfo()
    // hacer query de cualquier otro niño con mismo birth_date, maternal_surname, paternal_surname, names, y blood type
    // -> regresar id de casa del niño

    // si hay id de casa del niño, el niño ya existe
    
    // comparar id de casa de niño y del user
    
    // si son iguales, regresar respuesta ALREADY_REGISTERED_IN_SAME_HOUSE

    // si no, busca info del usuario tipo coordinador de la casa a la que pertenece el niño
    // también busca nombre de la casa con la id getHouseById in house get.model.js
    // regresar respuesta ALREADY_REGISTERED_IN_OTHER_HOUSE y objeto data:
    // data: {
    //     house: {
    //         id: "",
    //         name: ""
    //     },
    //     coordinator: {
    //         name: "",
    //         phoneNumber: "",
    //         email: "",
    //     }
    // };

    // al final, si el niño no existía, créalo.

    // regresar respuesta ADDED

}

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
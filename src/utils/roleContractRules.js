const { ROLES } = require("./roles");
const {
    EMPLOYEE_CONTRACT_TYPE_VALUES,
    normalizeEmployeeContractType,
} = require("./contractTypes");

const PATRONATO_ROLE_NAMES = Object.freeze([
    ROLES.PRESIDENT,
    ROLES.VICE_PRESIDENT,
    ROLES.TREASURER,
    ROLES.VOCAL,
]);

const ROLE_REQUIRED_CONTRACT_TYPE = Object.freeze({
    [ROLES.SUPPLIER]: "Proveedor",
    [ROLES.PRESIDENT]: "Patronato",
    [ROLES.VICE_PRESIDENT]: "Patronato",
    [ROLES.TREASURER]: "Patronato",
    [ROLES.VOCAL]: "Patronato",
});

const getRequiredContractTypeForRole = (roleName) =>
    ROLE_REQUIRED_CONTRACT_TYPE[roleName] ?? null;

const isContractTypeAllowedForRole = (roleName, contractType) => {
    const requiredType = getRequiredContractTypeForRole(roleName);

    if (!requiredType) return true;

    const normalizedType = normalizeEmployeeContractType(contractType);
    return normalizedType === requiredType;
};

const getAllowedContractTypesForRole = (roleName) => {
    const requiredType = getRequiredContractTypeForRole(roleName);

    if (!requiredType) {
        return [...EMPLOYEE_CONTRACT_TYPE_VALUES];
    }

    return [requiredType];
};

const resolveContractTypeForRole = (roleName, currentType) => {
    const requiredType = getRequiredContractTypeForRole(roleName);

    if (requiredType) {
        return requiredType;
    }

    if (currentType === null || currentType === undefined || currentType === "") {
        return currentType;
    }

    return normalizeEmployeeContractType(currentType);
};

const buildRoleContractMismatchMessage = (roleName, requiredType) =>
    `El puesto ${roleName} requiere contrato ${requiredType}`;

module.exports = {
    PATRONATO_ROLE_NAMES,
    ROLE_REQUIRED_CONTRACT_TYPE,
    getRequiredContractTypeForRole,
    isContractTypeAllowedForRole,
    getAllowedContractTypesForRole,
    resolveContractTypeForRole,
    buildRoleContractMismatchMessage,
};

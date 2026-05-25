const { findByCurpWithRoleAndHouse, findByIdWithRoleAndHouse } = require("../model/employee/get.model");
const { ROLES } = require("../utils/roles");

exports.canAddToBlacklist = async (user, resource) => {
    try {
        if (!user) return false;

        const targetCurp = resource?.curp;

        if (!targetCurp) {
            return {
                status: 400,
                message: "CURP no proporcionada",
            };
        }

        if (user.role !== ROLES.COORDINATOR && user.role !== ROLES.ADMIN) {
            return false;
        }

        const currentUser = await findByIdWithRoleAndHouse(user.id);
        const currentUserCurp = currentUser?.curp;

        if (currentUserCurp && String(currentUserCurp) === String(targetCurp)) {
            return {
                status: 403,
                message: "Acción denegada: No puedes agregarte a ti mismo a la lista negra.",
            };
        }

        const targetEmployee = await findByCurpWithRoleAndHouse(targetCurp);

        if (!targetEmployee) {
            return {
                status: 404,
                message: "Empleado no encontrado",
            };
        }

        if (user.role === ROLES.COORDINATOR && user.houseId !== targetEmployee.house_id) {
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error en canAddToBlacklist:", error);
        return false;
    }
};

exports.canRemoveFromBlacklist = async (user, resource) => {
    try {
        if (!user) return false;

        const targetCurp = resource?.curp;

        if (!targetCurp) {
            return {
                status: 400,
                message: "CURP no proporcionada",
            };
        }

        if (user.role !== ROLES.COORDINATOR && user.role !== ROLES.ADMIN) {
            return false;
        }

        const targetEmployee = await findByCurpWithRoleAndHouse(targetCurp);

        if (!targetEmployee) {
            return {
                status: 404,
                message: "Empleado no encontrado",
            };
        }

        if (user.role === ROLES.COORDINATOR && user.houseId !== targetEmployee.house_id) {
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error en canRemoveFromBlacklist:", error);
        return false;
    }
};

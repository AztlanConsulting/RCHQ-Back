const {
    getHome,
    findByIdWithRoleAndHouse,
    findByCurpWithRoleAndHouse,
} = require("../model/employee/get.model");
const { ROLES } = require("../utils/roles");

const isAdminRole = (roleName) =>
    roleName?.toLowerCase() === ROLES.ADMIN.toLowerCase();

exports.canAccess = (user, policyFn, resource) => {
    if (!user) return false;
    return policyFn(user, resource);
};

exports.authorize = (policyFn, getResource) => async (req, res, next) => {
    try {
        const resource =
            typeof getResource === "function"
                ? await getResource(req)
                : getResource;

        if (exports.canAccess(req.user, policyFn, resource)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Acceso denegado",
            error: "Acceso denegado",
        });
    } catch (error) {
        console.error("Error en middleware authorize:", error);
        return res.status(500).json({ message: "Error del servidor" });
    }
};

exports.isAllowed = async (req, res, next) => {
    try {
        const targetId = req.params.employeeId || req.params.id || "";

        if (req.user.role == ROLES.ADMIN) return next();
        if (req.user.id == targetId) return next();

        const homeQuery = await getHome(targetId);
        if (!homeQuery) return res.status(403).json({
            success: false,
            message: "No puede acceder a este recurso"
        });
        if (req.user.houseId == homeQuery.house_id && req.user.role == ROLES.COORDINATOR) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "No puede acceder a este recurso"
        });
    } catch (error) {
        console.error("Error en middleware isAllowed:", error);
        return res.status(403).json({
            success: false,
            message: "No puede acceder a este recurso"
        });
    }
};

exports.canRegisterEmployeeVacation = async (req, res, next) => {
    try {
        const targetEmployeeId = req.params.employeeId;

        const targetEmployee = await findByIdWithRoleAndHouse(targetEmployeeId);

        if (!targetEmployee) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        if (req.user.role === ROLES.ADMIN) {
            return next();
        }

        if (req.user.role !== ROLES.COORDINATOR && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        if (isAdminRole(targetEmployee.role?.name)) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        if (req.user.houseId !== targetEmployee.house_id) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        return next();
    } catch (error) {
        console.error("Error en canRegisterEmployeeVacation:", error);
         return res.status(403).json({
            success: false,
            message: "No puede acceder a este recurso",
        });
    }
};

exports.canAddToBlacklist = async (req, res, next) => {
    try {
        const targetCurp = req.body.curp;

        if (!targetCurp) {
            return res.status(400).json({ success: false, message: "CURP no proporcionada" });
        }

        if (req.user.role !== ROLES.COORDINATOR && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        const currentUser = await findByIdWithRoleAndHouse(req.user.id);
        const currentUserCurp = currentUser ? currentUser.curp : null;

        if (currentUserCurp && String(currentUserCurp) === String(targetCurp)) {
            return res.status(403).json({
                success: false,
                message: "Acción denegada: No puedes agregarte a ti mismo a la lista negra.",
            });
        }

        const targetEmployee = await findByCurpWithRoleAndHouse(targetCurp);

        if (!targetEmployee) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (req.user.houseId !== targetEmployee.house_id) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        return next();
    } catch (error) {
        console.error("Error en canAddToBlacklist:", error);
        return res.status(500).json({
            success: false,
            message: "Error del servidor",
        });
    }
};

exports.canRemoveFromBlacklist = async (req, res, next) => {
    try {
        const targetCurp = req.body.curp;

        if (!targetCurp) {
            return res.status(400).json({ success: false, message: "CURP no proporcionada" });
        }

        if (req.user.role !== ROLES.COORDINATOR && req.user.role !== ROLES.ADMIN) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        const targetEmployee = await findByCurpWithRoleAndHouse(targetCurp);

        if (!targetEmployee) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (req.user.houseId !== targetEmployee.house_id) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        return next();
    } catch (error) {
        console.error("Error en canRemoveFromBlacklist:", error);
        return res.status(500).json({
            success: false,
            message: "Error del servidor",
        });
    }
};

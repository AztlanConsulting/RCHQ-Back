const {
    getHome,
    findByIdWithRoleAndHouse,
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

        const isAllowed = await exports.canAccess(req.user, policyFn, resource);

        if (isAllowed === true) {
            return next();
        }

        if (typeof isAllowed === "object" && isAllowed !== null) {
            return res.status(isAllowed.status || 403).json({
                success: false,
                message: isAllowed.message || "Acceso denegado",
                error: isAllowed.message || "Acceso denegado",
            });
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
        if (!homeQuery) return next();

        if (
            req.user.houseId == homeQuery.house_id &&
            req.user.role == ROLES.COORDINATOR
        ) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Permisos insuficientes",
        });
    } catch (error) {
        console.error("Error en middleware isAllowed:", error);
        return res.status(403).json({
            success: false,
            message: "Permisos insuficientes",
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
                message: "Permisos insuficientes",
            });
        }

        if (req.user.role === ROLES.ADMIN) {
            return next();
        }

        if (
            req.user.role !== ROLES.COORDINATOR &&
            req.user.role !== ROLES.ADMIN
        ) {
            return res.status(403).json({
                success: false,
                message: "Permisos insuficientes",
            });
        }

        if (isAdminRole(targetEmployee.role?.name)) {
            return res.status(403).json({
                success: false,
                message: "Permisos insuficientes",
            });
        }

        if (req.user.houseId !== targetEmployee.house_id) {
            return res.status(403).json({
                success: false,
                message: "Permisos insuficientes",
            });
        }

        return next();
    } catch (error) {
        console.error("Error en canRegisterEmployeeVacation:", error);
        return res.status(403).json({
            success: false,
            message: "Permisos insuficientes",
        });
    }
};

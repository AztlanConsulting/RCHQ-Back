const { getHome } = require("../model/employee/get.model");

const canAccess = (user, policyFn, resource) => {
    if (!user) return false;
    return policyFn(user, resource);
};

const authorize = (policyFn, getResource) => async (req, res, next) => {
    try {
        const resource =
            typeof getResource === "function"
                ? await getResource(req)
                : getResource;

        if (canAccess(req.user, policyFn, resource)) {
            return next();
        }

        return res.status(403).json({ error: "Acceso denegado" });
    } catch {
        return res.status(500).json({ message: "Error del servidor" });
    }
};

const isAllowed = async (req, res, next) => {
    try {
        const targetId = req.params.employeeId || req.params.id || "";

        if (req.user.role == "Admin") return next();
        if (req.user.id == targetId) return next();

        const homeQuery = await getHome(targetId);
        if (!homeQuery) return res.status(403).json({
            success: false,
            message: "No puede acceder a este recurso"
        });
        if (req.user.houseId == homeQuery.house_id && req.user.role == "Coordinador") {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "No puede acceder a este recurso"
        });
    } catch {
        return res.status(403).json({
            success: false,
            message: "No puede acceder a este recurso"
        });
    }
};

module.exports = {
    authorize,
    canAccess,
    isAllowed,
};

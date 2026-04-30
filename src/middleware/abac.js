const { getHome } = require("../model/employee/consult.model");

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
    } catch (error) {
        return res.status(500).json({ error: "Error del servidor", error });
    }
};

const isAllowed = async (req, res, next) => {
    try {
        const targetId = req.params.id | req.params.employeeId | "";

        if (req.user.role == "Admin") return next();
        if (req.user.id == targetId) return next();

        const homeQuery = await getHome(req.params.id);
        if (!homeQuery) return res.status(500).json({ error: "Error del servidor" });
        if (req.user.houseId == homeQuery.house_id && req.user.role == "Coordinador") {
            return next();
        }

        return res.status(500).json({ error: "Error del servidor" });
    } catch {
        return res.status(500).json({ error: "Error del servidor" });
    }
};

module.exports = {
    authorize,
    canAccess,
    isAllowed,
};

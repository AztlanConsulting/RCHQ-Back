const { getHome, findByIdWithRoleAndHouse } = require("../model/employee/get.model");

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

        return res.status(403).json({ error: "Acceso denegado" });
    } catch {
        return res.status(500).json({ message: "Error del servidor" });
    }
};

exports.isAllowed = async (req, res, next) => {
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

        if (req.user.role === "Admin") {
            return next();
        }

        if (req.user.role !== "Coordinador") {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        const targetRoleName = targetEmployee.role?.name?.toLowerCase();

        if (targetRoleName === "admin") {
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
    } catch {
        return res.status(403).json({
            success: false,
            message: "No puede acceder a este recurso",
        });
    }
};

exports.canAddToBlacklist = async (req, res, next) => {
    try {
        const targetEmployee = await findByIdWithRoleAndHouse(req.params.employeeId);

        if (!targetEmployee) {
            return res.status(400).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (req.user.role === "Admin") return next();

        if (req.user.role !== "Coordinador") {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        const targetRoleName = targetEmployee.role?.name?.toLowerCase();

        if (targetRoleName === "admin") {
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
    } catch {
        return res.status(500).json({
            success: false,
            message: "Error del servidor",
        });
    }
};
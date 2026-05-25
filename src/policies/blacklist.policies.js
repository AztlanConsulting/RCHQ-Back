const { findByCurpWithRoleAndHouse } = require("../model/employee/get.model");
const { ROLES } = require("../utils/roles");

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

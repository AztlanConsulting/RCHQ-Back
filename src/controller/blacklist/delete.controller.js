const { removeFromBlacklist } = require("../../service/blacklist/delete.service");
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

exports.removeFromBlacklist = async (req, res) => {
    try {
        const { curp, reason } = req.body;
        const executorId = req.user.id;
        const ipAddress = getClientIp(req);

        const result = await removeFromBlacklist(curp, reason, executorId, ipAddress);

        if (result.code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (result.code === RESPONSES.BLACKLIST.NOT_IN_BLACKLIST) {
            return res.status(409).json({
                success: false,
                message: "El empleado no se encuentra en la lista negra",
            });
        }

        if (result.code === RESPONSES.BLACKLIST.REMOVED) {
            return res.status(200).json({
                success: true,
                message: result.data.warning || "Empleado eliminado de la lista negra",
                data: result.data,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    } catch (error) {
        console.error("Error en removeFromBlacklistController:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
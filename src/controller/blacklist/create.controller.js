const { insertIntoBlacklist } = require("../../service/blacklist/create.service");
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

exports.insertIntoBlacklist = async (req, res) => {
    try {
        const { curp } = req.params;
        const executorId = req.user.id;
        const ipAddress = getClientIp(req);

        const result = await insertIntoBlacklist(curp, executorId, ipAddress);

        if (result.code === RESPONSES.BLACKLIST.EMPLOYEE_NOT_FOUND) {
            return res.status(400).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (result.code === RESPONSES.BLACKLIST.INSERT_FAILED) {
            return res.status(400).json({
                success: false,
                message: "Fallo al insertar al empleado a la lista negra",
            });
        }

        if (result.code === RESPONSES.BLACKLIST.ADDED) {
            return res.status(200).json({
                success: true,
                message: result.data.warning || "Empleado agregado a la lista negra",
                data: result.data.blacklistEntry,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });

    } catch (error) {
        console.error("Error en insertIntoBlacklist controller:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
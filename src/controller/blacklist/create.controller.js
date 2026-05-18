const {
    insertIntoBlacklist,
} = require("../../service/blacklist/create.service");
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

exports.insertIntoBlacklist = async (req, res) => {
    try {
        const { curp } = req.body;
        const executorId = req.user.id;
        const ipAddress = getClientIp(req);

        const result = await insertIntoBlacklist(curp, executorId, ipAddress);

        if (result.code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (result.code === RESPONSES.BLACKLIST.ALREADY_EXISTS) {
            return res.status(409).json({
                success: false,
                message: "Este empleado ya se encuentra en la lista negra",
            });
        }

        if (result.code === RESPONSES.BLACKLIST.INSERT_FAILED) {
            return res.status(500).json({
                success: false,
                message: "Fallo al insertar al empleado a la lista negra",
            });
        }

        if (result.code === RESPONSES.BLACKLIST.ADDED) {
            return res.status(201).json({
                success: true,
                message:
                    result.data.warning || "Empleado agregado a la lista negra",
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

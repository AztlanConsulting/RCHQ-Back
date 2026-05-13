const { insertIntoBlacklist } = require("../../service/blacklist/create.service");
const RESPONSES = require("../../utils/responses");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");

exports.insertIntoBlacklist = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const executorId = req.user.id;

        const result = await insertIntoBlacklist(employeeId);

        if (result.type === RESPONSES.BLACKLIST.EMPLOYEE_NOT_FOUND) {
            return res.status(400).json({
                success: false,
                message: "Empleado no encontrado",
            });
        }

        if (result.type === RESPONSES.BLACKLIST.DEACTIVATION_FAILED) {
            return res.status(400).json({
                success: false,
                message: "Fallo al desactivar la cuenta del empleado",
            });
        }

        if (result.type === RESPONSES.BLACKLIST.INSERT_FAILED) {
            return res.status(400).json({
                success: false,
                message: "Fallo al insertar al empleado a la lista negra",
            });
        }

        if (result.type === RESPONSES.BLACKLIST.ADDED) {
            try {
                await createLog(
                    executorId,
                    LOG_ACTIONS.BLACKLIST_ADDED,
                    getClientIp(req),
                    `${result.data.employeeFullName} - ${result.data.curp}`,
                );
            } catch (err) {
                console.error("Error creando log insertIntoBlacklist:", err);
            }

            return res.status(200).json({
                success: true,
                message: "Empleado agregado a la lista negra",
                data: result.data.blacklistEntry,
            });
        }

    } catch {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};
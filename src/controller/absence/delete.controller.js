const { deleteAbsence } = require("../../service/absence/delete.service");
const RESPONSES = require("../../utils/responses");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");

exports.deleteAbsence = async (req, res) => {
    try {
        const actorEmployeeId = req.user?.id;
        const { absenceId } = req.params;

        const result = await deleteAbsence({
            actorEmployeeId,
            absenceId,
        });

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (result.code === RESPONSES.ABSENCE.INSUFFICIENT_PERMISSIONS) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para eliminar ausencias",
            });
        }

        if (result.code === RESPONSES.ABSENCE.OUT_OF_SCOPE) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        if (result.code === RESPONSES.ABSENCE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Ausencia no encontrada",
            });
        }

        if (result.code === RESPONSES.ABSENCE.VALIDATION_ERROR) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos",
                errors: result.errors,
            });
        }

        if (result.code === RESPONSES.ABSENCE.DELETED) {
            try {
                await createLog(
                    actorEmployeeId,
                    LOG_ACTIONS.ABSENCE_DELETED,
                    getClientIp(req),
                    result.data.absence.employeeId,
                );
            } catch (logError) {
                console.error("Error creando log deleteAbsence:", logError);
            }

            return res.status(200).json({
                success: true,
                message: "Ausencia eliminada correctamente",
                data: {
                    absence: result.data.absence,
                },
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    } catch (err) {
        console.error("deleteAbsence error:", err);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

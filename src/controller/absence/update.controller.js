const { updateAbsence } = require("../../service/absence/update.service");
const RESPONSES = require("../../utils/responses");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");

exports.updateAbsence = async (req, res) => {
    try {
        const actorEmployeeId = req.user?.id;
        const requesterHouseId = req.resolvedRequester?.houseId;
        const { absenceId } = req.params;
        const body = req.body;
        const file = req.file;

        const result = await updateAbsence({
            actorEmployeeId,
            requesterHouseId,
            absenceId,
            body,
            file,
        });

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (result.code == RESPONSES.ABSENCE.NULL_DATES) {
            return res.status(406).json({
                success: false,
                message: "Dentro del rango seleccionado no hay ningún día hábil para asignar la ausencia"
            });
        }

        if (result.code === RESPONSES.ABSENCE.INSUFFICIENT_PERMISSIONS) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos suficientes",
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

        if (result.code === RESPONSES.ABSENCE.INVALID_TYPE) {
            return res.status(422).json({
                success: false,
                message: "Tipo de ausencia inválida",
            });
        }

        if (result.code === RESPONSES.DATES.BAD_DATES) {
            return res.status(406).json({
                success: false,
                message:
                    "La fecha de fin no puede ser menor a la fecha de inicio",
            });
        }

        if (result.code === RESPONSES.ABSENCE.VALIDATION_ERROR) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos",
                errors: result.errors,
            });
        }

        if (result.code === RESPONSES.ABSENCE.UPDATED) {
            try {
                await createLog(
                    actorEmployeeId,
                    LOG_ACTIONS.ABSENCE_UPDATED,
                    getClientIp(req),
                    result.data.absence.employeeId,
                );
            } catch (logError) {
                console.error("Error creando log updateAbsence:", logError);
            }

            return res.status(200).json({
                success: true,
                message: "Ausencia actualizada correctamente",
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
        console.error("updateAbsence error:", err);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

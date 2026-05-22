const { addAbsence } = require("../../service/absence/create.service");
const RESPONSES = require("../../utils/responses");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { getClientIp } = require("../../utils/ip");

exports.addAbsence = async (req, res) => {
    try {
        const actorEmployeeId = req.user?.id;
        const requesterHouseId = req.resolvedRequester?.houseId;

        const result = await addAbsence({
            actorEmployeeId,
            requesterHouseId,
            targetEmployeeId: req.params.employeeId,
            body: req.body,
            file: req.file,
        });

        if (result.code === RESPONSES.ABSENCE.VALIDATION_ERROR) {
            return res.status(422).json({
                success: false,
                message: result.message || "Datos inválidos",
                errors: result.errors,
            });
        }

        if (result.code == RESPONSES.ABSENCE.NULL_DATES) {
            return res.status(406).json({
                success: false,
                message: "Dentro del rango seleccionado no hay ningún día hábil para asignar la ausencia"
            });
        }

        if (result.code === RESPONSES.ABSENCE.WITHOUT_DATES) {
            return res.status(406).json({
                success: false,
                message: "Se necesitan tener registrados los días de trabajo",
            });
        }

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (result.code === RESPONSES.ABSENCE.INSUFFICIENT_PERMISSIONS) {
            return res.status(403).json({
                success: false,
                message: "Permisos insuficientes",
            });
        }

        if (result.code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "usuario no encontrado",
            });
        }

        if (result.code === RESPONSES.ABSENCE.INVALID_TYPE) {
            return res.status(404).json({
                success: false,
                message: "tipo de ausencia no encontrado",
            });
        }

        if (result.code === RESPONSES.VACATION.ALREADY_REQUEST) {
            return res.status(406).json({
                success: false,
                message: "Ya hay una vacación registrada para esa fecha",
            });
        }

        if (result.code === RESPONSES.ABSENCE.LIMIT_REACHED) {
            return res.status(406).json({
                success: false,
                message:
                    "Limite de 10 ausencias registradas en una misma fecha",
            });
        }

        if (result.code === RESPONSES.ABSENCE.CREATED) {
            try {
                await createLog(
                    actorEmployeeId,
                    LOG_ACTIONS.ABSENCE_CREATED,
                    getClientIp(req),
                    result.data.absence.employeeId,
                );
            } catch (logError) {
                console.error("Error creando log addAbsence:", logError);
            }

            return res.status(201).json({
                success: true,
                message: "Ausencia creada con éxito",
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
        console.error("addAbsence error:", err);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

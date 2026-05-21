const {
    updateHouseEvent,
    updatePersonalEvent,
} = require("../../service/event/update.service");
const { getClientIp } = require("../../utils/ip");
const RESPONSES = require("../../utils/responses");

exports.updateHouseEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const {
            eventTypeId,
            name,
            start,
            end,
            allDay,
            isFreeDay,
            description,
            forceOverlap,
        } = req.body;

        const result = await updateHouseEvent(
            eventId,
            {
                eventTypeId,
                name,
                start,
                end,
                allDay,
                isFreeDay,
                description,
                forceOverlap,
            },
            req.user,
            getClientIp(req),
        );

        if (result.code === RESPONSES.EVENTS.VALIDATION_ERROR) {
            return res.status(422).json({
                success: false,
                message: "Datos inválidos. Verifique los campos.",
                data: { errors: result.data.errors },
            });
        }

        if (result.code === RESPONSES.EVENTS.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "El evento no fue encontrado.",
            });
        }

        if (result.code === RESPONSES.EVENTS.OVERLAP) {
            return res.status(409).json({
                success: false,
                message:
                    "Conflicto: existe un empalme con otro evento de la casa.",
                data: { collisions: result.data.collisions },
            });
        }

        if (result.code === RESPONSES.EVENTS.UPDATED) {
            return res.status(200).json({
                success: true,
                message: "Evento actualizado correctamente.",
                data: { houseEvent: result.data.houseEvent },
                warning: result.data.warning,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
};

exports.updatePersonalEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const result = await updatePersonalEvent(
            eventId,
            req.user,
            req.body,
            getClientIp(req),
        );

        if (result.code === RESPONSES.EVENTS.VALIDATION_ERROR) {
            return res.status(422).json({
                success: false,
                message: "Datos inválidos",
                errors: result.data.errors,
            });
        }

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos suficientes",
            });
        }

        if (result.code === RESPONSES.EMPLOYEE.NOT_PROVIDED) {
            return res.status(400).json({
                success: false,
                message: "Debes seleccionar al menos un empleado",
            });
        }

        if (result.code === RESPONSES.EMPLOYEE.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "Uno o más empleados no son válidos para esta casa",
            });
        }

        if (result.code === RESPONSES.EVENTS.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "El evento no fue encontrado",
            });
        }

        if (result.code === RESPONSES.EVENTS.OVERLAP) {
            return res.status(409).json({
                success: false,
                message: "Uno o más empleados tienen empalme en ese horario.",
                data: result.data,
            });
        }

        if (result.code === RESPONSES.EVENTS.UPDATED) {
            return res.status(200).json({
                success: true,
                message: "Evento personal actualizado correctamente",
                data: result.data.personalEvent,
                warning: result.data.warning,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    } catch (error) {
        console.error("updatePersonalEvent error:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};

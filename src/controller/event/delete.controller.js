const {
    deleteHouseEvent,
    deletePersonalEvent,
    removeEmployeeFromPersonalEvent,
} = require("../../service/event/delete.service");
const RESPONSES = require("../../utils/responses");
const { getClientIp } = require("../../utils/ip");

exports.deleteHouseEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const result = await deleteHouseEvent(
            eventId,
            req.user,
            getClientIp(req),
        );

        if (result.code === RESPONSES.EVENTS.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "El evento de casa no fue encontrado.",
            });
        }

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para eliminar este evento.",
            });
        }

        if (result.code === RESPONSES.EVENTS.DELETED) {
            return res.status(200).json({
                success: true,
                message: "Evento de casa eliminado correctamente.",
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

exports.deletePersonalEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const result = await deletePersonalEvent(
            eventId,
            req.user,
            getClientIp(req),
        );

        if (result.code === RESPONSES.EVENTS.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "El evento de personal no fue encontrado.",
            });
        }

        if (result.code === RESPONSES.USER.NOT_ACCESS) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para eliminar este evento.",
            });
        }

        if (result.code === RESPONSES.EVENTS.DELETED) {
            return res.status(200).json({
                success: true,
                message: "Evento de personal eliminado correctamente.",
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

exports.removeEmployeeFromPersonalEvent = async (req, res) => {
    try {
        const { eventId, employeeId } = req.params;

        const result = await removeEmployeeFromPersonalEvent(
            eventId,
            employeeId,
            req.user,
            getClientIp(req),
        );

        if (result.code === RESPONSES.EVENTS.NOT_FOUND) {
            return res.status(404).json({
                success: false,
                message: "La capacitación no fue encontrada.",
            });
        }

        if (result.code === RESPONSES.EVENTS.NOT_TRAINING_EVENT) {
            return res.status(400).json({
                success: false,
                message: "El evento no es una capacitación.",
            });
        }

        if (result.code === RESPONSES.EVENTS.EMPLOYEE_NOT_IN_EVENT) {
            return res.status(404).json({
                success: false,
                message: "El empleado no está asignado a esta capacitación.",
            });
        }

        if (result.code === RESPONSES.EVENTS.EMPLOYEE_REMOVED) {
            return res.status(200).json({
                success: true,
                message: "Empleado eliminado de la capacitación correctamente.",
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

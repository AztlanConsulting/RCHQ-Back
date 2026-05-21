const deleteService = require("../../service/event/delete.service");
const RESPONSES = require("../../utils/responses");

exports.deleteHouseEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const result = await deleteService.deleteHouseEvent(
            eventId,
            req.user,
            req,
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

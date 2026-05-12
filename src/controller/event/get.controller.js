const { getAllEventTypes, getEventsInRange } = require("../../service/event/get.service")
const RESPONSES = require("../../utils/responses");

exports.getAllEventTypes = async (req, res) => {
    try {
        const result = await getAllEventTypes();

        if (result.code == RESPONSES.EVENTS.NOT_FOUND) {
            return res.status().json({
                success: false,
                message: "Error al buscar los tipos de eventos o no hubo",
            });
        }

        if (result.code == RESPONSES.EVENTS.FOUND) {
            return res.status().json({
                success: true,
                data: {
                    eventTypes: result.data.eventTypes,
                }
            });
        }

    } catch {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        })
    }
}

exports.getEventsInRange = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const startDate = req.params.startDate;
        const endDate = req.params.endDate;

        const result = await getEventsInRange(employeeId, startDate, endDate);

        if (result.code == RESPONSES.DATES.WRONG_FORMAT) {
            return res.status(400).json({
                success: false,
                message: "Las fechas son requeridas y tienen que estar en formato YYYY-MM-DD"
            });
        }

        if (result.code == RESPONSES.DATES.BAD_DATES) {
            return res.status(406).json({
                success: false,
                message: "No se puede tener una fecha de inicio posterior a la de finalización"
            });
        }

        if (result.code == RESPONSES.EVENTS.FOUND) {
            return res.status(200).json({
                success: true,
                data: {
                    events: result.data.events
                }
            });
        }

    } catch {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor. Por favor intente más tarde.",
        });
    }
}
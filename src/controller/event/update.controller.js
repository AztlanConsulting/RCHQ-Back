const { updateHouseEvent } = require("../../service/event/update.service");
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
            req,
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

const createService = require("../../service/event/create.service");
const RESPONSES = require("../../utils/responses");

exports.createHouseEvent = async (req, res) => {
    try {
        const { houseId } = req.user;
        const {
            event_type_id,
            name,
            start,
            end,
            all_day,
            is_free_day,
            description,
            forceOverlap,
        } = req.body;

        const result = await createService.createHouseEvent({
            house_id: houseId,
            event_type_id,
            name,
            start,
            end,
            all_day,
            is_free_day,
            description,
            forceOverlap,
        }, req.user, req);

        if (result.code == RESPONSES.EVENTS.VALIDATION_ERROR) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos. Verifique los campos.",
                data: {
                    errors: result.data.errors,
                },
            });
        }

        if (result.code == RESPONSES.EVENTS.OVERLAP) {
            return res.status(409).json({
                success: false,
                message:
                    "Conflicto: existe un empalme con otro evento de la casa.",
                data: {
                    collisions: result.data.collisions,
                },
            });
        }

        if (result.code == RESPONSES.EVENTS.CREATED) {
            return res.status(201).json({
                success: true,
                message: "Evento creado correctamente.",
                data: {
                    houseEvent: result.data.houseEvent,
                },
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

const createService = require("../../service/event/create.service");
const RESPONSES = require("../../utils/responses");

exports.createHouseEvent = async (req, res) => {
    try {
        const { houseId } = req.user;
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

        const result = await createService.createHouseEvent(
            {
                houseId,
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

        if (result.code == RESPONSES.EVENTS.VALIDATION_ERROR) {
            return res.status(422).json({
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

exports.createPersonalEvent = async (req, res) => {
    try {
        const result = await createService.createPersonalEvent(
            req.user,
            req.body,
            req,
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

        if (result.code === RESPONSES.EVENTS.OVERLAP) {
            return res.status(409).json({
                success: false,
                message: "Uno o más empleados tienen empalme en ese horario.",
                data: result.data,
            });
        }

        if (result.code === RESPONSES.EVENTS.CREATED) {
            return res.status(201).json({
                success: true,
                message: "Evento personal creado correctamente",
                data: result.data.personalEvent,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    } catch (error) {
        console.error("createPersonalEvent error:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
};

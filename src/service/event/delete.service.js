const {
    softDeleteHouseEvent,
    softDeletePersonalEvent,
} = require("../../model/event/delete.model");
const {
    findHouseEventByIdAndHouseId,
    findPersonalEventById,
} = require("../../model/event/get.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");

exports.deleteHouseEvent = async (houseEventId, user, clientIp) => {
    const event = await findHouseEventByIdAndHouseId(houseEventId, user.houseId);

    if (!event) {
        return { code: RESPONSES.EVENTS.NOT_FOUND };
    }

    try {
        await softDeleteHouseEvent(houseEventId);
    } catch (error) {
        console.error("Error eliminando evento de casa:", error);
        throw error;
    }

    try {
        await createLog(
            user.id,
            LOG_ACTIONS.HOUSE_EVENT_DELETED,
            clientIp,
            houseEventId,
        );
    } catch (error) {
        console.error("Error creando log de eliminación de evento:", error);
    }

    return { code: RESPONSES.EVENTS.DELETED };
};

exports.deletePersonalEvent = async (personalEventId, user, clientIp) => {
    const event = await findPersonalEventById(personalEventId, user.houseId);

    if (!event) {
        return { code: RESPONSES.EVENTS.NOT_FOUND };
    }

    try {
        await softDeletePersonalEvent(personalEventId);
    } catch (error) {
        console.error("Error eliminando evento de personal:", error);
        throw error;
    }

    try {
        await createLog(
            user.id,
            LOG_ACTIONS.PERSONAL_EVENT_DELETED,
            clientIp,
            personalEventId,
        );
    } catch (error) {
        console.error(
            "Error creando log de eliminación de evento de personal:",
            error,
        );
    }

    return { code: RESPONSES.EVENTS.DELETED };
};

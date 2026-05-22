const {
    softDeleteHouseEvent,
    softDeletePersonalEvent,
} = require("../../model/event/delete.model");
const {
    findHouseEventById,
    findPersonalEventById,
} = require("../../model/event/get.model");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const { ROLES } = require("../../utils/roles");

exports.deleteHouseEvent = async (houseEventId, user, clientIp) => {
    const event = await findHouseEventById(houseEventId);

    if (!event || event.isDeleted) {
        return { code: RESPONSES.EVENTS.NOT_FOUND };
    }

    if (user.role === ROLES.COORDINATOR && event.houseId !== user.houseId) {
        return { code: RESPONSES.USER.NOT_ACCESS };
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

    if (user.role !== ROLES.COORDINATOR) {
        const isAssigned = event.employee_personal_event.some(
            (ep) => ep.employee_id === user.id,
        );
        if (!isAssigned) {
            return { code: RESPONSES.USER.NOT_ACCESS };
        }
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
        console.error("Error creando log de eliminación de evento de personal:", error);
    }

    return { code: RESPONSES.EVENTS.DELETED };
};

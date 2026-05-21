const { softDeleteHouseEvent } = require("../../model/event/delete.model");
const { findHouseEventById } = require("../../model/event/get.model");
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

    await softDeleteHouseEvent(houseEventId);

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

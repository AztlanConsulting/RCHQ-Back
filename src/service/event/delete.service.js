const {
    softDeleteHouseEvent,
    softDeletePersonalEvent,
    removeEmployeeFromPersonalEvent,
} = require("../../model/event/delete.model");
const {
    findHouseEventByIdAndHouseId,
    findPersonalEventById,
    findPersonalEventByIdIncludeDeleted,
    findEmployeeInPersonalEvent,
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

exports.removeEmployeeFromPersonalEvent = async (personalEventId, employeeId, user, clientIp) => {
    const event = await findPersonalEventByIdIncludeDeleted(personalEventId, user.houseId);

    if (!event) {
        return { code: RESPONSES.EVENTS.NOT_FOUND };
    }

    if (event.event_type?.name !== "Capacitaciones") {
        return { code: RESPONSES.EVENTS.NOT_TRAINING_EVENT };
    }

    const relation = await findEmployeeInPersonalEvent(personalEventId, employeeId);

    if (!relation) {
        return { code: RESPONSES.EVENTS.EMPLOYEE_NOT_IN_EVENT };
    }

    try {
        await removeEmployeeFromPersonalEvent(personalEventId, employeeId);
    } catch (error) {
        console.error("Error eliminando empleado del evento de personal:", error);
        throw error;
    }

    try {
        await createLog(
            user.id,
            LOG_ACTIONS.PERSONAL_EVENT_EMPLOYEE_REMOVED,
            clientIp,
            personalEventId,
        );
    } catch (error) {
        console.error("Error creando log de eliminación de empleado de evento:", error);
    }

    return { code: RESPONSES.EVENTS.EMPLOYEE_REMOVED };
};

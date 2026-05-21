const {
    findHouseEventByIdAndHouseId,
    findOverlappingHouseEvents,
} = require("../../model/event/get.model");
const { updateHouseEvent } = require("../../model/event/update.model");
const { createLog } = require("../../model/log.model");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const {
    houseEventUpdateSchema,
} = require("../../schemas/event/update.schemas");

exports.updateHouseEvent = async (eventId, data, user, clientIp) => {
    const parsed = houseEventUpdateSchema.safeParse(data);

    if (!parsed.success) {
        return {
            code: RESPONSES.EVENTS.VALIDATION_ERROR,
            data: {
                errors: parsed.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            },
        };
    }

    const validData = parsed.data;

    const existingEvent = await findHouseEventByIdAndHouseId(
        eventId,
        user.houseId,
    );

    if (!existingEvent) {
        return { code: RESPONSES.EVENTS.NOT_FOUND };
    }

    const collisions = await findOverlappingHouseEvents({
        houseId: user.houseId,
        start: validData.start,
        end: validData.end,
        excludeEventId: eventId,
    });

    if (collisions.length > 0 && !validData.forceOverlap) {
        return {
            code: RESPONSES.EVENTS.OVERLAP,
            data: { collisions },
        };
    }

    const houseEvent = await updateHouseEvent(eventId, {
        eventTypeId: validData.eventTypeId,
        name: validData.name,
        start: validData.start,
        end: validData.end,
        allDay: validData.allDay,
        isFreeDay: validData.isFreeDay,
        description: validData.description ?? null,
    });

    let warning = null;

    try {
        await createLog(
            user.id,
            LOG_ACTIONS.HOUSE_EVENT_UPDATED,
            clientIp,
            eventId,
        );
    } catch (error) {
        console.error("Error creando log de actualización de evento:", error);
        warning = "Evento actualizado pero el log falló";
    }

    return {
        code: RESPONSES.EVENTS.UPDATED,
        data: { houseEvent, warning },
    };
};

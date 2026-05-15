const createModel = require("../../model/event/create.model");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { LOG_ACTIONS } = require("../../utils/logActions");
const RESPONSES = require("../../utils/responses");
const {
    houseEventCreateSchema,
} = require("../../schemas/event/create.schemas");

const validateAvailability = async (data) => {
    return await createModel.findOverlappingHouseEvents({
        houseId: data.houseId,
        start: data.start,
        end: data.end,
    });
};

exports.createHouseEvent = async (data, user, req) => {
    const parsed = houseEventCreateSchema.safeParse(data);

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

    const collisions = await validateAvailability({
        houseId: validData.houseId,
        start: validData.start,
        end: validData.end,
    });

    if (collisions.length > 0 && !validData.forceOverlap) {
        return {
            code: RESPONSES.EVENTS.OVERLAP,
            data: { collisions },
        };
    }

    const houseEvent = await createModel.createHouseEvent({
        houseId: validData.houseId,
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
            LOG_ACTIONS.HOUSE_EVENT_CREATED,
            getClientIp(req),
            houseEvent.houseEventId,
        );
    } catch (error) {
        console.error("Error creando log de evento:", error);
        warning = "Evento creado pero el log falló";
    }

    return {
        code: RESPONSES.EVENTS.CREATED,
        data: { houseEvent, warning },
    };
};

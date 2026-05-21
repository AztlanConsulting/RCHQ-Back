const prisma = require("../../prisma");
const { mapHouseEvent } = require("../../utils/mappers/event.map");

exports.updateHouseEvent = async (eventId, data) => {
    const houseEvent = await prisma.house_event.update({
        where: { house_event_id: eventId },
        data: {
            event_type_id: data.eventTypeId,
            name: data.name,
            start: data.start,
            end: data.end,
            all_day: data.allDay,
            is_free_day: data.isFreeDay,
            description: data.description,
        },
    });

    return mapHouseEvent(houseEvent);
};

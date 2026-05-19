const prisma = require("../../prisma");
const { mapHouseEvent } = require("../../utils/mappers/event.map");

exports.findHouseEventById = async (eventId, houseId) => {
    return await prisma.house_event.findFirst({
        where: {
            house_event_id: eventId,
            house_id: houseId,
        },
    });
};

exports.findOverlappingHouseEvents = async ({
    houseId,
    start,
    end,
    excludeEventId,
}) => {
    const houseEvents = await prisma.house_event.findMany({
        where: {
            house_id: houseId,
            house_event_id: { not: excludeEventId },
            start: { lt: end },
            end: { gt: start },
        },
        select: {
            house_event_id: true,
            name: true,
            start: true,
            end: true,
        },
    });

    return houseEvents.map(mapHouseEvent);
};

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

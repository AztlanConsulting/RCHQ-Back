const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const { mapHouseEvent } = require("../../utils/mappers/event.map");

const prisma = new PrismaClient();

exports.findOverlappingHouseEvents = async ({ houseId, start, end }) => {
    const houseEvents = await prisma.house_event.findMany({
        where: {
            house_id: houseId,
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

exports.createHouseEvent = async (data) => {
    const houseEvent = await prisma.house_event.create({
        data: {
            house_event_id: randomUUID(),
            house_id: data.houseId,
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

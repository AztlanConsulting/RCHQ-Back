const prisma = require("../../prisma");
const { mapHouseEvent } = require("../../utils/mappers/event.map");

exports.findHouseEventById = async (houseEventId) => {
    const event = await prisma.house_event.findUnique({
        where: { house_event_id: houseEventId },
    });

    return mapHouseEvent(event);
};

exports.softDeleteHouseEvent = async (houseEventId) => {
    return await prisma.house_event.update({
        where: { house_event_id: houseEventId },
        data: { is_deleted: true },
    });
};

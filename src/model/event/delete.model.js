const prisma = require("../../prisma");

exports.softDeleteHouseEvent = async (houseEventId) => {
    return await prisma.house_event.update({
        where: { house_event_id: houseEventId },
        data: { is_deleted: true },
    });
};

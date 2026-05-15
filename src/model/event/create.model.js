const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

exports.findOverlappingHouseEvents = async ({ house_id, start, end }) => {
    return await prisma.house_event.findMany({
        where: {
            house_id,
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
};

exports.createHouseEvent = async (data) => {
    return await prisma.house_event.create({
        data: {
            house_event_id: randomUUID(),
            house_id: data.house_id,
            event_type_id: data.event_type_id,
            name: data.name,
            start: data.start,
            end: data.end,
            all_day: data.all_day,
            is_free_day: data.is_free_day,
            description: data.description,
        },
    });
};

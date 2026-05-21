const prisma = require("../../prisma");
const { randomUUID } = require("crypto");
const {
    mapHouseEvent,
    mapPersonalEvent,
} = require("../../utils/mappers/event.map");
const personalEventTimeToUtc = (date, time) =>
    new Date(`${date}T${time}-06:00`);

exports.findOverlappingHouseEvents = async ({ houseId, start, end }) => {
    const houseEvents = await prisma.house_event.findMany({
        where: {
            house_id: houseId,
            is_deleted: false,
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

exports.createPersonalEvent = async (data) => {
    return prisma.$transaction(async (transaction) => {
        const event = await transaction.personal_event.create({
            data: {
                personal_event_id: data.personalEventId,
                event_type_id: data.eventTypeId,
                date: new Date(data.date),
                start: personalEventTimeToUtc(data.date, data.start),
                end: personalEventTimeToUtc(
                    data.endDate ?? data.date,
                    data.end,
                ),
                name: data.name,
                description: data.description ?? null,
                all_day: data.allDay,
            },
        });

        await transaction.employee_personal_event.createMany({
            data: data.employeeIds.map((employeeId) => ({
                personal_event_id: data.personalEventId,
                employee_id: employeeId,
            })),
            skipDuplicates: true,
        });

        return mapPersonalEvent(event, {
            date: data.date,
            start: data.start,
            end: data.end,
            employeeIds: data.employeeIds,
        });
    });
};

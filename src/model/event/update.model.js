const prisma = require("../../prisma");
const { mapHouseEvent, mapPersonalEvent } = require("../../utils/mappers/event.map");
const { eventDateTimeToUtc } = require("../../utils/event/dateTime");

exports.updatePersonalEvent = async (eventId, data) => {
    return prisma.$transaction(async (transaction) => {
        const event = await transaction.personal_event.update({
            where: { personal_event_id: eventId },
            data: {
                event_type_id: data.eventTypeId,
                name: data.name,
                date: new Date(data.date),
                start: eventDateTimeToUtc(data.date, data.start),
                end: eventDateTimeToUtc(data.endDate ?? data.date, data.end),
                all_day: data.allDay,
                description: data.description ?? null,
                trainer: data.trainer ?? null,
            },
        });

        await transaction.employee_personal_event.deleteMany({
            where: { personal_event_id: eventId },
        });

        await transaction.employee_personal_event.createMany({
            data: data.employeeIds.map((employeeId) => ({
                personal_event_id: eventId,
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

exports.updatePersonalEventEmployees = async (eventId, employeeIds, trainer = null) => {
    return prisma.$transaction(async (transaction) => {
        const event = await transaction.personal_event.update({
            where: { personal_event_id: eventId },
            data: { trainer },
        });

        await transaction.employee_personal_event.deleteMany({
            where: { personal_event_id: eventId },
        });

        await transaction.employee_personal_event.createMany({
            data: employeeIds.map((employeeId) => ({
                personal_event_id: eventId,
                employee_id: employeeId,
            })),
            skipDuplicates: true,
        });

        return mapPersonalEvent(event, { employeeIds });
    });
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

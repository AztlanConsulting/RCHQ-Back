const prisma = require("../../prisma");
const { Prisma } = require("@prisma/client");
const {
    mapHouseEvent,
    mapGlobalEvent,
    mapPersonalEventOverlap,
} = require("../../utils/mappers/event.map");
const { eventDateTimeToUtc } = require("../../utils/event/dateTime");

exports.getAllEventTypes = async () => {
    return await prisma.event_type.findMany({
        select: {
            event_type_id: true,
            name: true,
        },
    });
};

exports.findHouseEventByIdAndHouseId = async (eventId, houseId) => {
    const event = await prisma.house_event.findFirst({
        where: {
            house_event_id: eventId,
            house_id: houseId,
            is_deleted: false,
        },
    });

    return mapHouseEvent(event);
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

exports.getHouseEventsInRange = async (houseId, startDate, endDate) => {
    const houseEvents = await prisma.house_event.findMany({
        where: {
            house_id: houseId,
            is_deleted: false,
            start: {
                lte: endDate,
            },
            end: {
                gte: startDate,
            },
        },
        include: {
            event_type: true,
        },
    });

    return houseEvents.map(({ is_free_day, is_deleted, ...event }) => ({
        ...event,
        isFreeDay: is_free_day,
        isDeleted: is_deleted,
    }));
};

exports.getPersonalEventsInRange = async (employeeId, startDate, endDate) => {
    return await prisma.personal_event.findMany({
        where: {
            is_deleted: false,
            date: {
                gte: startDate,
                lte: endDate,
            },
            employee_personal_event: {
                some: {
                    employee: {
                        employee_id: employeeId,
                    },
                },
            },
        },
        include: {
            event_type: true,
            employee_personal_event: {
                include: {
                    employee: {
                        select: {
                            employee_id: true,
                            name: true,
                            surname: true,
                        },
                    },
                },
            },
        },
    });
};

exports.getHouseCalendarPersonalEventsInRange = async (
    requesterId,
    houseId,
    startDate,
    endDate,
) => {
    return await prisma.personal_event.findMany({
        where: {
            is_deleted: false,
            date: {
                gte: startDate,
                lte: endDate,
            },
            employee_personal_event: {
                some: {
                    employee: {
                        house_id: houseId,
                    },
                },
                none: {
                    employee: {
                        employee_id: requesterId,
                    },
                },
            },
        },
        include: {
            event_type: true,
            employee_personal_event: {
                include: {
                    employee: {
                        select: {
                            employee_id: true,
                            name: true,
                            surname: true,
                        },
                    },
                },
            },
        },
    });
};

exports.getGlobalEventsInRange = async (startDate, endDate) => {
    const globalEvents = await prisma.global_event.findMany({
        where: {
            is_deleted: false,
            start: {
                lte: endDate,
            },
            end: {
                gte: startDate,
            },
        },
        include: {
            event_type: true,
        },
    });

    return globalEvents.map(({ is_free_day, is_deleted, ...event }) => ({
        ...event,
        isFreeDay: is_free_day,
        isDeleted: is_deleted,
    }));
};

exports.findOverlappingGlobalEvents = async ({
    start,
    end,
    excludeEventId,
}) => {
    const events = await prisma.global_event.findMany({
        where: {
            global_event_id: excludeEventId
                ? { not: excludeEventId }
                : undefined,
            is_deleted: false,
            start: { lt: end },
            end: { gt: start },
        },
        select: {
            global_event_id: true,
            name: true,
            start: true,
            end: true,
        },
    });

    return events.map(mapGlobalEvent);
};

exports.getEventsByIds = async (eventIds) => {
    if (eventIds.length === 0) {
        return [];
    }

    const [houseEvents, personalEvents, globalEvents] = await Promise.all([
        prisma.house_event.findMany({
            where: {
                house_event_id: {
                    in: eventIds,
                },
            },
            select: {
                house_event_id: true,
                name: true,
            },
        }),
        prisma.personal_event.findMany({
            where: {
                personal_event_id: {
                    in: eventIds,
                },
            },
            select: {
                personal_event_id: true,
                name: true,
            },
        }),
        prisma.global_event.findMany({
            where: {
                global_event_id: {
                    in: eventIds,
                },
            },
            select: {
                global_event_id: true,
                name: true,
            },
        }),
    ]);

    return [
        ...houseEvents.map((event) => ({
            id: event.house_event_id,
            name: event.name,
        })),
        ...personalEvents.map((event) => ({
            id: event.personal_event_id,
            name: event.name,
        })),
        ...globalEvents.map((event) => ({
            id: event.global_event_id,
            name: event.name,
        })),
    ];
};

exports.getEmployeesByHouse = (houseId, search) => {
    if (!search || search.trim() === "") {
        return prisma.$queryRaw`
            SELECT
                e.employee_id AS "employeeId",
                (e.name || ' ' || e.surname) AS "fullName",
                e.picture AS "picture"
            FROM employee e
            WHERE e.house_id = ${houseId}::uuid
              AND e.is_active = true
            ORDER BY e.name ASC, e.surname ASC
        `;
    }

    const tokens = search.trim().split(/\s+/).filter(Boolean);

    const conditions = tokens.map(
        (token) => Prisma.sql`
        (
            unaccent(e.name) ILIKE unaccent(${"%" + token + "%"})
            OR unaccent(e.surname) ILIKE unaccent(${"%" + token + "%"})
        )
    `,
    );

    const whereSearch = Prisma.join(conditions, " AND ");

    return prisma.$queryRaw`
        SELECT
            e.employee_id AS "employeeId",
            (e.name || ' ' || e.surname) AS "fullName",
            e.picture AS "picture"
        FROM employee e
        WHERE e.house_id = ${houseId}::uuid
          AND e.is_active = true
          AND ${whereSearch}
        ORDER BY e.name ASC, e.surname ASC
    `;
};

exports.getEmployeesInHouse = (employeeIds, houseId) => {
    return prisma.employee.findMany({
        where: {
            employee_id: { in: employeeIds },
            house_id: houseId,
            is_active: true,
        },
        select: { employee_id: true },
    });
};

exports.findPersonalEventById = async (eventId, houseId) => {
    return prisma.personal_event.findFirst({
        where: {
            personal_event_id: eventId,
            is_deleted: false,
            employee_personal_event: {
                some: {
                    employee: { house_id: houseId },
                },
            },
        },
        include: {
            employee_personal_event: {
                select: { employee_id: true },
            },
        },
    });
};

exports.findOverlappingEmployees = async ({
    employeeIds,
    date,
    start,
    end,
    endDate = date,
    excludeEventId = null,
}) => {
    const overlaps = await prisma.employee_personal_event.findMany({
        where: {
            employee_id: { in: employeeIds },
            ...(excludeEventId
                ? { personal_event_id: { not: excludeEventId } }
                : {}),
            personal_event: {
                is_deleted: false,
                date: new Date(date),
                start: {
                    lt: eventDateTimeToUtc(endDate, end),
                },
                end: {
                    gt: eventDateTimeToUtc(date, start),
                },
            },
        },
        select: {
            employee_id: true,
            employee: {
                select: {
                    name: true,
                    surname: true,
                },
            },
            personal_event: {
                select: {
                    personal_event_id: true,
                    name: true,
                    date: true,
                    start: true,
                    end: true,
                },
            },
        },
    });

    return overlaps.map(mapPersonalEventOverlap);
};

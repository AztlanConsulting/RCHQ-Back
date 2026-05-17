const prisma = require("../../prisma");
const { Prisma } = require("@prisma/client");
const { mapPersonalEventOverlap } = require("../../utils/mappers/event.map");

exports.getAllEventTypes = async () => {
    return await prisma.event_type.findMany({
        select: {
            event_type_id: true,
            name: true,
        },
    });
};

exports.getHouseEventsInRange = async (houseId, startDate, endDate) => {
    return await prisma.house_event.findMany({
        where: {
            house_id: houseId,
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
};

exports.getPersonalEventsInRange = async (employeeId, startDate, endDate) => {
    return await prisma.employee_personal_event.findMany({
        where: {
            employee_id: employeeId,
            personal_event: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        },
        include: {
            personal_event: {
                include: {
                    event_type: true,
                },
            },
        },
    });
};

exports.getGlobalEventsInRange = async (startDate, endDate) => {
    return await prisma.global_event.findMany({
        where: {
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

exports.findOverlappingEmployees = async ({
    employeeIds,
    date,
    start,
    end,
}) => {
    const overlaps = await prisma.employee_personal_event.findMany({
        where: {
            employee_id: { in: employeeIds },
            personal_event: {
                date: new Date(date),
                start: {
                    lt: new Date(
                        new Date(`2026-01-01T${end}Z`).getTime() +
                            6 * 60 * 60 * 1000,
                    ),
                },
                end: {
                    gt: new Date(
                        new Date(`2026-01-01T${start}Z`).getTime() +
                            6 * 60 * 60 * 1000,
                    ),
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

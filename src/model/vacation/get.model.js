const prisma = require("../../prisma");
const { Prisma } = require("@prisma/client");
const { ACTIVE_VACATION_STATUSES } = require("../../utils/vacationStatus");
const {
    buildVacationRequestSearchSqlParts,
} = require("../../utils/vacationRequestSearch");

const employeeBasicSearch = {
    employee: {
        select: {
            employee_id: true,
            name: true,
            surname: true,
            curp: true,
            picture: true,
            start_date: true,
            house: {
                select: {
                    house_id: true,
                    name: true,
                },
            },
        },
    },
};

exports.getVacationsInRange = async (employeeId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
        where: {
            employee_id: employeeId,
            start: {
                lte: endDate,
            },
            end: {
                gte: startDate,
            },
            status: {
                not: 2,
            },
        },
        include: {
            employee: {
                select: {
                    employee_id: true,
                    name: true,
                    surname: true,
                    curp: true,
                    employee_workday: {
                        include: {
                            workday: true,
                        },
                    },
                },
            },
        }
    });
};

exports.getHouseCalendarVacationsInRange = async (requesterId, houseId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
        where: {
            start: {
                lte: endDate,
            },
            end: {
                gte: startDate,
            },
            status: {
                not: 2,
            },
            employee: {
                house_id: houseId,
            },
            NOT: {
                employee: {
                    employee_id: requesterId,
                }
            }
        },
        include: {
            employee: {
                select: {
                    employee_id: true,
                    name: true,
                    surname: true,
                    curp: true,
                    employee_workday: {
                        include: {
                            workday: true,
                        },
                    },
                },
            },
        }
    });
};

exports.getOutsideVacations = async (employeeId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
        where: {
            employee_id: employeeId,
            start: {
                lte: startDate,
            },
            end: {
                gte: endDate,
            },
            status: {
                not: 2,
            },
        },
    });
};

exports.getActiveVacationsInRange = async (employeeId, startDate, endDate) => {
    return await prisma.vacations_request.findMany({
        where: {
            employee_id: employeeId,
            status: {
                in: ACTIVE_VACATION_STATUSES,
            },
            start: {
                lte: endDate,
            },
            end: {
                gte: startDate,
            },
        },
    });
};

exports.getVacationRequestById = async (vacationRequestId) => {
    return await prisma.vacations_request.findUnique({
        where: {
            vacations_request_id: vacationRequestId,
        },
    });
};

const getVacationRequestsByHouseRaw = async ({
    houseId,
    statusFilter,
    search,
    startDate,
    endDate,
    skip,
    take,
    reviewed = false,
}) => {
    const { baseWhereSql, mapVacationRequestRow } =
        buildVacationRequestSearchSqlParts({
            houseId,
            statusFilter,
            search,
            startDate,
            endDate,
        });

    const orderSql = reviewed
        ? Prisma.sql`
        ORDER BY
            vr.created_at DESC,
            vr.start DESC,
            vr.vacations_request_id ASC
    `
        : Prisma.sql`
        ORDER BY
            vr.created_at DESC,
            vr.start ASC,
            vr.vacations_request_id ASC
    `;

    const [rows, countRows] = await Promise.all([
        prisma.$queryRaw`
            SELECT
                vr.vacations_request_id,
                vr.employee_id,
                vr.start,
                vr."end",
                vr.status,
                vr.feedback,
                vr.created_at,
                vr.used_days,
                e.name AS employee_name,
                e.surname AS employee_surname,
                e.curp AS employee_curp,
                e.picture AS employee_picture,
                e.start_date AS employee_start_date,
                h.house_id,
                h.name AS house_name
            ${baseWhereSql}
            ${orderSql}
            OFFSET ${skip}
            LIMIT ${take}
        `,
        prisma.$queryRaw`
            SELECT COUNT(*)::int AS total
            ${baseWhereSql}
        `,
    ]);

    return {
        requests: rows.map(mapVacationRequestRow),
        total: countRows[0]?.total || 0,
    };
};

exports.getPendingVacationRequestsByHouse = async ({
    where,
    skip,
    take,
    searchFilters,
}) => {
    if (searchFilters) {
        return getVacationRequestsByHouseRaw({
            ...searchFilters,
            skip,
            take,
            reviewed: false,
        });
    }

    const [requests, total] = await Promise.all([
        prisma.vacations_request.findMany({
            where,
            include: employeeBasicSearch,
            orderBy: [
                { created_at: "desc" },
                { start: "asc" },
                { vacations_request_id: "asc" },
            ],
            skip,
            take,
        }),
        prisma.vacations_request.count({ where }),
    ]);

    return { requests, total };
};

exports.getReviewedVacationRequestsByHouse = async ({
    where,
    skip,
    take,
    searchFilters,
}) => {
    if (searchFilters) {
        return getVacationRequestsByHouseRaw({
            ...searchFilters,
            skip,
            take,
            reviewed: true,
        });
    }

    const [requests, total] = await Promise.all([
        prisma.vacations_request.findMany({
            where,
            include: employeeBasicSearch,
            orderBy: [
                { created_at: "desc" },
                { start: "desc" },
                { vacations_request_id: "asc" },
            ],
            skip,
            take,
        }),
        prisma.vacations_request.count({ where }),
    ]);

    return { requests, total };
};

exports.getVacationRequestsByEmployee = async ({ where, skip, take }) => {
    const [requests, total] = await Promise.all([
        prisma.vacations_request.findMany({
            where,
            include: employeeBasicSearch,
            orderBy: [
                { created_at: "desc" },
                { start: "desc" },
                { vacations_request_id: "asc" },
            ],
            skip,
            take,
        }),
        prisma.vacations_request.count({ where }),
    ]);

    return { requests, total };
};

exports.getEligibleVacationEmployees = async (where) => {
    return await prisma.employee.findMany({
        where,
        select: {
            employee_id: true,
            name: true,
            surname: true,
            curp: true,
            is_active: true,
        },
        orderBy: [
            { name: "asc" },
            { surname: "asc" },
        ],
    });
};

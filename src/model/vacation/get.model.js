const prisma = require("../../prisma");
const { ACTIVE_VACATION_STATUSES } = require("../../utils/vacationStatus");

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

exports.getPendingVacationRequestsByHouse = async ({
    where,
    skip,
    take,
}) => {
    const [requests, total] = await Promise.all([
        prisma.vacations_request.findMany({
            where,
            include: {
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
            },
            orderBy: [
                { created_at: "desc" },
                { start: "asc" },
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
}) => {
    const [requests, total] = await Promise.all([
        prisma.vacations_request.findMany({
            where,
            include: {
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
            },
            orderBy: [
                { created_at: "desc" },
                { start: "desc" },
            ],
            skip,
            take,
        }),
        prisma.vacations_request.count({ where }),
    ]);

    return { requests, total };
};

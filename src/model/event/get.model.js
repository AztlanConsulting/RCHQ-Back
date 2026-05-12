const prisma = require("../../prisma");

exports.getAllEventTypes = async () => {
    const result = await prisma.event_type.findMany({
        select: {
            name: true,
        }
    });
    return result;
}

exports.getHouseEventsInRange = async (houseId, startDate, endDate) => {
    return await prisma.house_event.findMany({
        where: {
            house_id: houseId,
            date: {
                gte: startDate,
                lte: endDate
            },
        },
        include : {
            event_type: true
        }
    });
}

exports.getPersonalEventsInRange = async (employeeId, startDate, endDate) => {
    return await prisma.employee_personal_event.findMany({
        where: {
            employee_id: employeeId,
            personal_event: {
                start: {
                    lte: endDate
                },
                end: {
                    gte: startDate
                }
            }
        },
        include : {
            personal_event: {
                include: {
                    event_type: true
                }
            }
        }
    });
}

exports.getGlobalEventsInRange = async (startDate, endDate) => {
    return await prisma.global_event.findMany({
        where: {
            date: {
                gte: startDate,
                lte: endDate
            },
        },
        include : {
            event_type: true
        }
    });
}
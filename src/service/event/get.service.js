const {
    getVacationsInRange,
    getHouseCalendarVacationsInRange,
} = require("../../model/vacation/get.model");
const {
    getHouseCalendarAbsenceInRange,
    getAbsencesInRange,
} = require("../../model/absence/get.model");
const { dateRangeSchema } = require("../../schemas/dates.schemas");
const {
    calculateUsedDays,
    stringToDate,
    convertUTCToMexicanTime,
} = require("../../utils/dates");
const {
    getHome,
    findById,
    getWorkDays,
} = require("../../model/employee/get.model");
const {
    getAllEventTypes,
    getHouseEventsInRange,
    getPersonalEventsInRange,
    getGlobalEventsInRange,
    getEmployeesByHouse,
    getHouseCalendarPersonalEventsInRange,
} = require("../../model/event/get.model");
const {
    mapEmployeeAbsenceCalendarEvent,
    mapHouseVacationCalendarEvent,
    mapPersonalCalendarEvent,
} = require("../../utils/mappers/event.map");
const RESPONSES = require("../../utils/responses");
const { searchEmployeesSchema } = require("../../schemas/event/create.schemas");
const {
    mapHouseAbsenceCalendarEvent,
} = require("../../utils/mappers/absence.map");
const normalizeFreeDayCalendarRange = (event) => {
    if (event.isFreeDay !== true) return event;

    return {
        ...event,
        end:
            event.end instanceof Date
                ? new Date(event.end.getTime() - 1)
                : event.end,
    };
};

exports.getAllEventTypes = async () => {
    const result = await getAllEventTypes();

    if (!result || result.length <= 0) {
        return {
            code: RESPONSES.EVENTS.NOT_FOUND,
        };
    }

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            eventTypes: result.map((eventType) => ({
                ...(eventType.event_type_id && {
                    eventTypeId: eventType.event_type_id,
                }),
                name: eventType.name,
            })),
        },
    };
};

exports.getEventsInRange = async (
    employeeId,
    rawStartDate,
    rawEndDate,
) => {
    const validation = dateRangeSchema.safeParse({
        startDate: rawStartDate,
        endDate: rawEndDate,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.DATES.WRONG_FORMAT,
        };
    }

    const startDate = stringToDate(rawStartDate);
    const endDate = stringToDate(rawEndDate);

    if (endDate < startDate) {
        return {
            code: RESPONSES.DATES.BAD_DATES,
        };
    }

    const employee = await findById(employeeId);
    if (!employee) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const result = await getHome(employeeId);
    const houseId = result.house_id;

    const events = [];

    if (houseId) {
        const houseEvents = await getHouseEventsInRange(
            houseId,
            startDate,
            endDate,
        );
        houseEvents.forEach((rawEvent) => {
            const event = normalizeFreeDayCalendarRange(rawEvent);
            events.push({
                houseEventId: event.house_event_id,
                eventTypeId: event.event_type_id,
                start: event.start,
                end: event.end,
                date: "",
                name: event.name,
                type: event.event_type.name,
                subtitle: event.subtitle || "",
                focus: "eventos",
                scope: "house",
                description: event.description,
                color: "#7FD447",
                link: "",
                allDay: event.all_day,
                isFreeDay: event.isFreeDay || false,
            });
        });
    }

    const personalEvents = await getPersonalEventsInRange(
        employeeId,
        startDate,
        endDate,
    );
    personalEvents.forEach((event) => {
        events.push(mapPersonalCalendarEvent(event));
    });

    const globalEvents = await getGlobalEventsInRange(startDate, endDate);
    globalEvents.forEach((rawEvent) => {
        const event = normalizeFreeDayCalendarRange(rawEvent);
        events.push({
            start: event.start,
            end: event.end,
            date: "",
            name: event.name,
            subtitle: event.subtitle || "",
            focus: "eventos",
            scope: "global",
            type: event.event_type.name,
            description: event.description,
            color: "#C524FF",
            link: "",
            allDay: event.all_day,
            isFreeDay: event.isFreeDay || false,
        });
    });

    const workDays = await getWorkDays(employeeId);
    const freeDays = events
        .filter((event) => {
            return (
                (event.scope === "global" || event.scope === "house") &&
                event.isFreeDay === true &&
                event.start instanceof Date &&
                event.end instanceof Date
            );
        })
        .map((event) => ({
            ...event,
            start: convertUTCToMexicanTime(event.start),
            end: convertUTCToMexicanTime(event.end),
        }));

    const vacations = await getVacationsInRange(employeeId, startDate, endDate);
    vacations.forEach((vacation) => {
        const usedDays = calculateUsedDays(
            workDays,
            vacation.start,
            vacation.end,
            freeDays,
        );

        events.push(mapHouseVacationCalendarEvent(vacation, usedDays));
    });

    const absences = await getAbsencesInRange(employeeId, startDate, endDate);

    absences.forEach((absence) => {
        const usedDays = calculateUsedDays(
            workDays,
            absence.start,
            absence.end,
            freeDays,
        );

        events.push(mapEmployeeAbsenceCalendarEvent(absence, usedDays));
    });

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            events: events,
        },
    };
};

exports.getHouseCalendarRecordsInRange = async (
    requesterId,
    houseId,
    rawStartDate,
    rawEndDate,
) => {
    const validation = dateRangeSchema.safeParse({
        startDate: rawStartDate,
        endDate: rawEndDate,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.DATES.WRONG_FORMAT,
        };
    }

    const startDate = stringToDate(rawStartDate);
    const endDate = stringToDate(rawEndDate);

    if (endDate < startDate) {
        return {
            code: RESPONSES.DATES.BAD_DATES,
        };
    }

    const vacations = await getHouseCalendarVacationsInRange(
        requesterId,
        houseId,
        startDate,
        endDate,
    );
    const absences = await getHouseCalendarAbsenceInRange(
        requesterId,
        houseId,
        startDate,
        endDate,
    );

    const [houseEvents, globalEvents, personalEvents] = await Promise.all([
        getHouseEventsInRange(houseId, startDate, endDate),
        getGlobalEventsInRange(startDate, endDate),
        getHouseCalendarPersonalEventsInRange(
            requesterId,
            houseId,
            startDate,
            endDate,
        ),
    ]);

    const freeDays = [...houseEvents, ...globalEvents]
        .filter((event) => event.isFreeDay === true)
        .map((event) => ({
            ...event,
            start: convertUTCToMexicanTime(event.start),
            end: convertUTCToMexicanTime(event.end),
        }));

    const events = [];

    vacations.forEach((vacation) => {
        const usedDays = calculateUsedDays(
            vacation.employee.employee_workday,
            vacation.start,
            vacation.end,
            freeDays,
        );

        events.push(mapHouseVacationCalendarEvent(vacation, usedDays));
    });

    absences.forEach((absence) => {
        const usedDays = calculateUsedDays(
            absence.employee.employee_workday,
            absence.start,
            absence.end,
            freeDays,
        );

        events.push(mapHouseAbsenceCalendarEvent(absence, usedDays));
    });

    personalEvents.forEach((event) => {
        events.push(mapPersonalCalendarEvent(event));
    });

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            events,
        },
    };
};

exports.getEmployeesForSelector = async (user, query) => {
    if (!user?.houseId) {
        return { code: RESPONSES.USER.NOT_ACCESS };
    }

    const parsed = searchEmployeesSchema.safeParse(query);
    if (!parsed.success) {
        return {
            code: RESPONSES.EVENTS.VALIDATION_ERROR,
            data: { errors: parsed.error.flatten().fieldErrors },
        };
    }

    const employees = await getEmployeesByHouse(
        user.houseId,
        parsed.data.search ?? "",
    );

    return { code: RESPONSES.EVENTS.FOUND, data: { employees } };
};

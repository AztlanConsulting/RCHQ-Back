const { getVacationsInRange } = require("../../model/vacation/get.model");
const { dateRangeSchema } = require("../../schemas/dates.schemas")
const {
    calculateUsedDays,
    combineDateAndTime,
    stringToDate,
} = require("../../utils/dates");
const { 
    getHome, 
    findById 
} = require("../../model/employee/get.model");
const {
    getAllEventTypes,
    getHouseAbsencesInRange: getHouseAbsenceRecordsInRange,
    getHouseEventsInRange,
    getPersonalEventsInRange,
    getGlobalEventsInRange,
} = require("../../model/event/get.model");
const RESPONSES = require("../../utils/responses");
const {
    mapHouseAbsenceCalendarEvent,
} = require("../../utils/mappers/absence.map");

exports.getAllEventTypes = async () => {
    const result = await getAllEventTypes();

    if (!result || result.length <= 0) {
        return {
            code: RESPONSES.EVENTS.NOT_FOUND,
        }
    }

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            eventTypes: result,
        }
    };
};

exports.getEventsInRange = async (employeeId, rawStartDate, rawEndDate) => {
    const validation = dateRangeSchema.safeParse({
        startDate: rawStartDate,
        endDate: rawEndDate,
    });

    if (!validation.success) {
        return {
            code: RESPONSES.DATES.WRONG_FORMAT
        };
    }

    const startDate = stringToDate(rawStartDate);
    const endDate = stringToDate(rawEndDate);
    
    if (endDate < startDate) {
        return {
            code: RESPONSES.DATES.BAD_DATES
        }
    }

    const employee = await findById(employeeId);
    if (!employee) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND
        }
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
        houseEvents.forEach((event) => {
            events.push({
                start: combineDateAndTime(event.date, event.start),
                end: combineDateAndTime(event.date, event.end),
                date: event.date,
                name: event.name,
                type: event.event_type.name,
                subtitle: event.subtitle || "",
                focus: "eventos",
                scope: "house",
                description: event.description,
                color: "#7FD447",
                link: "",
                lastsAllDay: false,
            });
        });
    }

    const personalEvents = await getPersonalEventsInRange(
        employeeId,
        startDate,
        endDate,
    );
    personalEvents.forEach((event) => {
        events.push({
            start: event.personal_event.start,
            end: event.personal_event.end,
            date: "",
            name: event.personal_event.name,
            type: event.personal_event.event_type.name,
            subtitle: event.subtitle || "",
            focus: "eventos",
            scope: "personal",
            description: event.description,
            color: "#EFBF22",
            link: "",
            lastsAllDay: false,
        });
    });

    const globalEvents = await getGlobalEventsInRange(startDate, endDate);
    globalEvents.forEach((event) => {
        events.push({
            start: combineDateAndTime(event.date, event.start),
            end: combineDateAndTime(event.date, event.end),
            date: event.date,
            name: event.name,
            subtitle: event.subtitle || "",
            focus: "eventos",
            scope: "global",
            type: event.event_type.name,
            description: event.description,
            color: "#C524FF",
            link: "",
            lastsAllDay: false,
        });
    });

    const vacations = await getVacationsInRange(employeeId, startDate, endDate);
    vacations.forEach((vacation) => {
        const vacationEnd = new Date(vacation.end);
        vacationEnd.setUTCDate(vacationEnd.getUTCDate() + 1);

        events.push({
            start: vacation.start,
            end: vacationEnd,
            name: "Vacaciones",
            type: "Vacaciones",
            focus: "vacaciones",
            scope: "personal",
            status: vacation.status,
            color: vacation.status == 0 ? "#86d982" : "#55c94f",
            link: "",
            lastsAllDay: true,
        });
    });

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            events: events
        }
    }

};

exports.getHouseAbsencesInRange = async (houseId, rawStartDate, rawEndDate) => {
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

    const absences = await getHouseAbsenceRecordsInRange(houseId, startDate, endDate);

    if (absences.length <= 0) {
        return {
            code: RESPONSES.EVENTS.FOUND,
            data: {
                events: [],
            },
        };
    }

    const supportRangeStart = absences.reduce(
        (minDate, absence) => absence.start < minDate ? absence.start : minDate,
        absences[0].start,
    );
    const supportRangeEnd = absences.reduce(
        (maxDate, absence) => absence.end > maxDate ? absence.end : maxDate,
        absences[0].end,
    );

    const [houseEvents, globalEvents] = await Promise.all([
        getHouseEventsInRange(houseId, supportRangeStart, supportRangeEnd),
        getGlobalEventsInRange(supportRangeStart, supportRangeEnd),
    ]);

    const freeDays = [...houseEvents, ...globalEvents].filter(
        (event) => event.is_free_day === true,
    );

    const events = [];

    absences.forEach((absence) => {
        const usedDays = calculateUsedDays(
            absence.employee.employee_workday,
            absence.start,
            absence.end,
            freeDays,
        );

        events.push(mapHouseAbsenceCalendarEvent(absence, usedDays));
    });

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            events,
        },
    };
};

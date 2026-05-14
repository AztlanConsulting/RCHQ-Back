const { getVacationsInRange } = require("../../model/vacation/get.model");
const { dateRangeSchema } = require("../../schemas/dates.schemas");
const {
    calculateUsedDays,
    combineDateAndTime,
    stringToDate,
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
    getAbsencesInRange,
} = require("../../model/event/get.model");
const {
    mapEmployeeAbsenceCalendarEvent,
} = require("../../utils/mappers/event.map");
const RESPONSES = require("../../utils/responses");

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
            eventTypes: result,
        },
    };
};

exports.getEventsInRange = async (employeeId, rawStartDate, rawEndDate) => {
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

    const absences = await getAbsencesInRange(employeeId, startDate, endDate);

    if (absences.length === 0) {
        return {
            code: RESPONSES.EVENTS.FOUND,
            data: {
                events: events,
            },
        };
    }

    const workDays = await getWorkDays(employeeId);

    absences.forEach((absence) => {
        const absenceFreeDays = events.filter((event) => {
            return (
                event.scope === "global" &&
                event.scope === "house" &&
                event.is_free_day === true &&
                event.date instanceof Date &&
                event.date >= absence.start &&
                event.date <= absence.end
            );
        });

        const usedDays = calculateUsedDays(
            workDays,
            absence.start,
            absence.end,
            absenceFreeDays,
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

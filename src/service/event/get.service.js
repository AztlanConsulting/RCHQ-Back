const { getVacationsInRange } = require("../../model/vacation/get.model");
const { getHome } = require("../../model/employee/get.model");
const { dateRangeSchema } = require("../../schemas/dates.schemas")
const { combineDateAndTime, stringToDate } = require("../../utils/dates");
const {
    getHouseEventsInRange,
    getPersonalEventsInRange,
    getGlobalEventsInRange,
} = require("../../model/event/get.model");
const RESPONSES = require("../../utils/responses");

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

    const result = await getHome(employeeId);
    const houseId = result.house_id;

    const events = [];

    if(houseId) {
        const houseEvents = await getHouseEventsInRange(
            houseId,
            startDate,
            endDate,
        );
        houseEvents.forEach((event) => {
            events.push({
                start: combineDateAndTime(event.date, event.start),
                end: combineDateAndTime(event.date, event.end),
                name: event.name,
                type: event.event_type.name,
                color: "#09dbe6",
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
            name: event.personal_event.name,
            type: event.personal_event.event_type.name,
            color: "#09dbe6",
            link: "",
            lastsAllDay: false,
        });
    });

    const globalEvents = await getGlobalEventsInRange(startDate, endDate);
    globalEvents.forEach((event) => {
        events.push({
            start: combineDateAndTime(event.date, event.start),
            end: combineDateAndTime(event.date, event.end),
            name: event.name,
            type: event.event_type.name,
            color: "#09dbe6",
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

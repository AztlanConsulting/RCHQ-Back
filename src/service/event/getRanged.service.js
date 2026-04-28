const { combineDateAndTime } = require("../../utils/dates")
const { getVacationsInRange } = require("../../model/vacation/consult.model")
const { getHome } = require("../../model/employee/consult.model")
const { 
    getHouseEventsInRange,
    getPersonalEventsInRange,
    getGlobalEventsInRange
} = require("../../model/event/getRanged.model")

exports.getEventsInRange = async (employeeId, startDate, endDate) => {
    const result = await getHome(employeeId);
    const houseId = result.house_id;

    console.log(startDate, endDate);

    const events = [];

    const houseEvents = await getHouseEventsInRange(houseId, startDate, endDate);
    houseEvents.forEach(event => {
        events.push({
            start: combineDateAndTime(event.date, event.start),
            end: combineDateAndTime(event.date, event.end),
            name: event.name,
            type: event.event_type.name,
            color: "#443322",
            link: ""
        })
    });

    const personalEvents = await getPersonalEventsInRange(employeeId, startDate, endDate);
    personalEvents.forEach(event => {
        events.push({
            start: event.personal_event.start,
            end: event.personal_event.end,
            name: event.personal_event.name,
            type: event.personal_event.event_type.name,
            color: "#443322",
            link: ""
        })
    });

    const globalEvents = await getGlobalEventsInRange(startDate, endDate);
    globalEvents.forEach(event => {
        events.push({
            start: combineDateAndTime(event.date, event.start),
            end: combineDateAndTime(event.date, event.end),
            name: event.name,
            type: event.event_type.name,
            color: "#443322",
            link: ""
        })
    });

    const vacations = await getVacationsInRange(employeeId, startDate, endDate);
    vacations.forEach(vacation => {
        events.push({
            start: vacation.start,
            end: vacation.end,  
            name: "Vacaciones",
            type: "Vacaciones",
            color: vacation.status == 0 ? "#221100" : "#443322",
            link: ""
        })
    });

    return events;
}
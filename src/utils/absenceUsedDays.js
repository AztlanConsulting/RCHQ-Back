const {
    getGlobalEventsInRange,
    getHouseEventsInRange,
} = require("../model/event/get.model");
const { getActiveVacationsInRange } = require("../model/vacation/get.model");
const { convertUTCToMexicanTime } = require("./dates");
const { endOfUtcDay } = require("./event/dateTime");

const toUtcDate = (date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

exports.toUtcDate = toUtcDate;

exports.getAbsenceCalculationContext = async ({
    employeeId,
    houseId,
    startDate,
    endDate,
}) => {
    const searchEndDate = endOfUtcDay(endDate);

    const [globalEvents, houseEvents, overlappingVacations] = await Promise.all([
        getGlobalEventsInRange(startDate, searchEndDate),
        getHouseEventsInRange(houseId, startDate, searchEndDate),
        getActiveVacationsInRange(employeeId, startDate, searchEndDate),
    ]);

    const freeDays = [...houseEvents, ...globalEvents]
        .filter((event) => event.isFreeDay === true)
        .map((event) => ({
            ...event,
            start: convertUTCToMexicanTime(event.start),
            end: convertUTCToMexicanTime(event.end),
        }));

    return {
        searchEndDate,
        freeDays,
        overlappingVacations,
    };
};

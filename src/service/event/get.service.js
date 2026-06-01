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
    getMexicoTodayDate,
    getLastIncludedDateForRange,
    spanishToDay,
} = require("../../utils/dates");
const {
    getHome,
    findById,
    getWorkDays,
    findByIdWithRoleAndHouse,
} = require("../../model/employee/get.model");
const {
    getAllEventTypes,
    getHouseEventsInRange,
    getPersonalEventsInRange,
    getTrainingsByEmployee,
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
const { ROLES } = require("../../utils/roles");
const { searchEmployeesSchema } = require("../../schemas/event/create.schemas");
const {
    mapHouseAbsenceCalendarEvent,
} = require("../../utils/mappers/absence.map");
const { getRemainingVacations } = require("../vacation/get.service");

const DATE_RULE_MODES = {
    VACATION: "vacation",
    ABSENCE: "absence",
};

const toDateOnly = (date) => date.toISOString().slice(0, 10);

const addUtcDays = (date, amount) => {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + amount);
    return nextDate;
};

const addUtcMonths = (date, amount) =>
    new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() + amount,
        date.getUTCDate(),
    ));

const addUtcYears = (date, amount) =>
    new Date(Date.UTC(
        date.getUTCFullYear() + amount,
        date.getUTCMonth(),
        date.getUTCDate(),
    ));

const getWorkdayNumbers = (workDays = []) =>
    workDays
        .map((workDay) => spanishToDay(workDay.workday?.name))
        .filter((day) => day >= 0);

const getFreeDayDates = (events = [], minDate, maxDate) => {
    const dates = new Set();

    events
        .filter((event) => event.isFreeDay === true)
        .forEach((event) => {
            if (!event.start || !event.end) return;

            const eventStart = convertUTCToMexicanTime(event.start);
            const eventEnd = convertUTCToMexicanTime(event.end);
            let currentDate = new Date(Date.UTC(
                eventStart.getUTCFullYear(),
                eventStart.getUTCMonth(),
                eventStart.getUTCDate(),
            ));
            const lastDate = getLastIncludedDateForRange(eventStart, eventEnd);

            while (currentDate <= lastDate) {
                if (currentDate >= minDate && currentDate <= maxDate) {
                    dates.add(toDateOnly(currentDate));
                }

                currentDate = addUtcDays(currentDate, 1);
            }
        });

    return [...dates].sort();
};

exports.getAllEventTypes = async (user, scope) => {
    const result = await getAllEventTypes();

    if (!result || result.length <= 0) {
        return {
            code: RESPONSES.EVENTS.NOT_FOUND,
        };
    }

    const isPersonalScope = scope === "personal";
    const isCoordinator = user?.role === ROLES.COORDINATOR;

    const filtered = result.filter((eventType) => {
        if (eventType.name.toLowerCase() === "capacitaciones") {
            return isPersonalScope && isCoordinator;
        }
        return true;
    });

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            eventTypes: filtered.map((eventType) => ({
                ...(eventType.event_type_id && {
                    eventTypeId: eventType.event_type_id,
                }),
                name: eventType.name,
            })),
        },
    };
};

exports.getEmployeeDateRules = async ({ employeeId, mode = DATE_RULE_MODES.ABSENCE }) => {
    const normalizedMode =
        mode === DATE_RULE_MODES.VACATION
            ? DATE_RULE_MODES.VACATION
            : DATE_RULE_MODES.ABSENCE;
    const employee = await findByIdWithRoleAndHouse(employeeId);

    if (!employee || employee.is_active === false) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const workDays = await getWorkDays(employeeId);

    if (workDays.length === 0) {
        return {
            code:
                normalizedMode === DATE_RULE_MODES.VACATION
                    ? RESPONSES.VACATION.WITHOUT_DATES
                    : RESPONSES.ABSENCE.WITHOUT_DATES,
        };
    }

    const today = getMexicoTodayDate();
    let minDate = addUtcMonths(today, -1);
    let maxDate = addUtcYears(today, 1);
    let vacationPeriod = null;
    let remainingVacations = null;

    if (normalizedMode === DATE_RULE_MODES.VACATION) {
        const remainingVacationResult = await getRemainingVacations(employeeId);

        if (!remainingVacationResult.data) {
            return {
                code: remainingVacationResult.code,
            };
        }

        const anniversaryStartDate = remainingVacationResult.data.startDate;
        const anniversaryEndDate = remainingVacationResult.data.endDate;
        const tomorrow = addUtcDays(today, 1);

        minDate =
            anniversaryStartDate > tomorrow ? anniversaryStartDate : tomorrow;
        maxDate = anniversaryEndDate;
        remainingVacations = remainingVacationResult.data.remainingDays;
        vacationPeriod = {
            startDate: toDateOnly(anniversaryStartDate),
            endDate: toDateOnly(anniversaryEndDate),
        };
    }

    if (maxDate < minDate) {
        return {
            code: RESPONSES.DATES.BAD_DATES,
        };
    }

    const freeDaySearchStartDate = addUtcYears(today, -1);
    const freeDaySearchEndDate = addUtcYears(today, 1);
    const searchEndDate = addUtcDays(freeDaySearchEndDate, 1);
    const [globalEvents, houseEvents] = await Promise.all([
        getGlobalEventsInRange(freeDaySearchStartDate, searchEndDate),
        getHouseEventsInRange(
            employee.house_id,
            freeDaySearchStartDate,
            searchEndDate,
        ),
    ]);
    const workdayNumbers = getWorkdayNumbers(workDays);
    const nonWorkingWeekdays = [0, 1, 2, 3, 4, 5, 6].filter(
        (day) => !workdayNumbers.includes(day),
    );

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            employeeId,
            mode: normalizedMode,
            minDate: toDateOnly(minDate),
            maxDate: toDateOnly(maxDate),
            today: toDateOnly(today),
            workDays: workDays.map((workDay) => ({
                workdayId: workDay.workday?.workday_id,
                name: workDay.workday?.name,
                weekday: spanishToDay(workDay.workday?.name),
                start: workDay.start,
                end: workDay.end,
            })),
            nonWorkingWeekdays,
            freeDays: getFreeDayDates(
                [...houseEvents, ...globalEvents],
                freeDaySearchStartDate,
                freeDaySearchEndDate,
            ),
            vacationPeriod,
            remainingVacations,
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
        houseEvents.forEach((event) => {
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
                color: "#307351",
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
    globalEvents.forEach((event) => {
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
            color: "#B66897",
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

exports.getTrainingsByEmployee = async (employeeId) => {

    if (!employeeId) {
        return {
            code: RESPONSES.EVENTS.VALIDATION_ERROR,
        };
    }

    const employee = await findById(employeeId);
    if (!employee) {
        return {
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        };
    }

    const trainings = await getTrainingsByEmployee(employeeId);
    if (!trainings || trainings.length === 0) {
        return {
            code: RESPONSES.EVENTS.NOT_FOUND,
            data: {
                trainings: [],
            },
        };
    }

    return {
        code: RESPONSES.EVENTS.FOUND,
        data: {
            trainings: trainings.map(mapPersonalCalendarEvent),
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

const {
    dateRangeToMexicoCalendarInterval,
    isAllDayInTimeZone,
    MEXICO_TIME_ZONE,
} = require("../event/dateTime");

exports.mapHouseEvent = (event) => {
    if (!event) return null;

    return {
        houseEventId: event.house_event_id,
        houseId: event.house_id,
        eventTypeId: event.event_type_id,
        name: event.name,
        start: event.start,
        end: event.end,
        allDay: event.all_day,
        isFreeDay: event.is_free_day,
        isDeleted: event.is_deleted,
        description: event.description,
    };
};

exports.mapEmployeeAbsenceCalendarEvent = (
    absence,
    usedDays,
    { timeZone = MEXICO_TIME_ZONE } = {},
) => {
    const { start, end } = dateRangeToMexicoCalendarInterval(
        absence.start,
        absence.end,
    );

    return {
        absenceId: absence.absence_id,
        employeeId: absence.employee_id,
        name: `${absence.employee.name} ${absence.employee.surname}`.trim(),
        curp: absence.employee.curp,
        start,
        end,
        startDate: absence.start,
        endDate: absence.end,
        type: absence.absence_type?.name || "Ausencia",
        subtitle: absence.employee?.curp || "",
        description: absence.description || "",
        link: absence.url || "",
        isDeleted: absence.is_deleted,
        usedDays,
        focus: "ausencias",
        scope: "personal",
        color: "#F97316",
        allDay: isAllDayInTimeZone(start, end, timeZone),
    };
};

exports.mapHouseVacationCalendarEvent = (
    vacation,
    usedDays,
    { timeZone = MEXICO_TIME_ZONE } = {},
) => {
    const { start, end } = dateRangeToMexicoCalendarInterval(
        vacation.start,
        vacation.end,
    );

    return {
        vacationId: vacation.vacations_request_id,
        employeeId: vacation.employee.employee_id,
        name: `${vacation.employee.name} ${vacation.employee.surname}`.trim(),
        curp: vacation.employee.curp,
        start,
        end,
        startDate: vacation.start,
        endDate: vacation.end,
        status: vacation.status,
        feedback: vacation.feedback,
        link: vacation.url || "",
        focus: "vacaciones",
        scope: "house",
        color: vacation.status == 1 ? "#1439BA" : "#5673DB",
        allDay: isAllDayInTimeZone(start, end, timeZone),
        usedDays,
    };
};

exports.mapPersonalCalendarEvent = (
    event,
    { timeZone = MEXICO_TIME_ZONE } = {},
) => {
    const peopleData = [];
    const start = event.start;
    const end = event.end;

    event.employee_personal_event.forEach((employeeEvent) => {
        peopleData.push({
            name: `${employeeEvent.employee.name} ${employeeEvent.employee.surname}`.trim(),
            id: employeeEvent.employee.employee_id,
        });
    });

    return {
        eventId: event.personal_event_id,
        date: event.date,
        start,
        end,
        startDate: start,
        endDate: end,
        name: event.name,
        type: event.event_type.name,
        focus: "eventos",
        scope: "personal",
        description: event.description ?? "",
        color: "#EFBF22",
        allDay: event.all_day
            ? isAllDayInTimeZone(start, end, timeZone)
            : false,
        peopleInsideEvent: peopleData,
    };
};

exports.mapPersonalEvent = (event, options = {}) => {
    if (!event) return null;

    return {
        personalEventId: event.personal_event_id,
        eventTypeId: event.event_type_id,
        date: options.date ?? event.date,
        start: options.start ?? event.start,
        end: options.end ?? event.end,
        name: event.name,
        description: event.description,
        allDay: event.all_day,
        isDeleted: event.is_deleted,
        employeeIds: options.employeeIds,
    };
};

exports.mapPersonalEventOverlap = (row) => {
    if (!row) return null;

    const employeeFullName = [row.employee?.name, row.employee?.surname]
        .filter(Boolean)
        .join(" ");

    return {
        employeeId: row.employee_id,
        employeeName: employeeFullName,
        event: {
            personalEventId: row.personal_event?.personal_event_id,
            name: row.personal_event?.name,
            date: row.personal_event?.date,
            start: row.personal_event?.start,
            end: row.personal_event?.end,
        },
    };
};

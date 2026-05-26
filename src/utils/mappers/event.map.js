const { convertUTCToMexicanTime, combineDateAndTime } = require("../dates");

exports.mapHouseEvent = (event) => {
    if (!event) return null;

    return {
        houseEventId: event.house_event_id,
        houseId: event.house_id,
        eventTypeId: event.event_type_id,
        name: event.name,
        start: convertUTCToMexicanTime(event.start),
        end: convertUTCToMexicanTime(event.end),
        allDay: event.all_day,
        isFreeDay: event.is_free_day,
        isDeleted: event.is_deleted,
        description: event.description,
    };
};

exports.mapEmployeeAbsenceCalendarEvent = (absence, usedDays) => {
    const calendarEnd = new Date(absence.end);
    calendarEnd.setUTCDate(calendarEnd.getUTCDate() + 1);

    return {
        absenceId: absence.absence_id,
        employeeId: absence.employee_id,
        name: `${absence.employee.name} ${absence.employee.surname}`.trim(),
        curp: absence.employee.curp,
        start: absence.start,
        end: calendarEnd,
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
        color: "#BA274A",
        allDay: true,
    };
};

exports.mapHouseVacationCalendarEvent = (vacation, usedDays) => {
    const calendarEnd = new Date(vacation.end);
    calendarEnd.setUTCDate(calendarEnd.getUTCDate() + 1);

    return {
        vacationId: vacation.vacations_request_id,
        employeeId: vacation.employee.employee_id,
        name: `${vacation.employee.name} ${vacation.employee.surname}`.trim(),
        curp: vacation.employee.curp,
        start: vacation.start,
        end: calendarEnd,
        startDate: vacation.start,
        endDate: vacation.end,
        status: vacation.status,
        feedback: vacation.feedback,
        link: vacation.url || "",
        focus: "vacaciones",
        scope: "house",
        color: vacation.status == 1 ? "#203766" : "#6298C7",
        allDay: true,
        usedDays,
    };
};

exports.mapPersonalCalendarEvent = (event) => {
    const peopleData = [];
    const start = combineDateAndTime(event.date, event.start);
    const endCalendarDate = event.all_day
        ? convertUTCToMexicanTime(event.end)
        : event.date;
    const end = combineDateAndTime(endCalendarDate, event.end);

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
        color: "#D58936",
        allDay: event.all_day || false,
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

const formatTime = (time) => {
    if (!time) return null;
    return convertUTCToMexicanTime(time).toISOString().slice(11, 19);
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
            start: formatTime(row.personal_event?.start),
            end: formatTime(row.personal_event?.end),
        },
    };
};

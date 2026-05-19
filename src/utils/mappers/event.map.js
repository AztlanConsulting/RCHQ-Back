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
        color: "#F97316",
        lastsAllDay: true,
    };
};

exports.mapHouseVacationCalendarEvent = (vacation, usedDays) => {
    return {
        vacationId: vacation.vacations_request_id,
        employeeId: vacation.employee.employee_id,
        name: `${vacation.employee.name} ${vacation.employee.surname}`.trim(),
        curp: vacation.employee.curp,
        start: vacation.start,
        end: vacation.end,
        status: vacation.status,
        feedback: vacation.feedback,
        link: vacation.url || "",
        focus: "vacaciones",
        scope: "house",
        color: vacation.status == 1 ? "#1439BA" : "#5673DB",
        lastsAllDay: true,
        usedDays,
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
        employeeIds: options.employeeIds,
    };
};

const formatTime = (time) => {
    if (!time) return null;

    const cst = new Date(time.getTime() - 6 * 60 * 60 * 1000);
    return cst.toISOString().slice(11, 19);
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

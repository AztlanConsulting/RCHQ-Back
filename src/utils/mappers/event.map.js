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

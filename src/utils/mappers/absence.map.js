exports.mapHouseAbsenceCalendarEvent = (absence, usedDays) => {
    const calendarEnd = new Date(absence.end);
    calendarEnd.setUTCDate(calendarEnd.getUTCDate() + 1);

    return {
        absenceId: absence.absence_id,
        employeeId: absence.employee.employee_id,
        name: `${absence.employee.name} ${absence.employee.surname}`.trim(),
        curp: absence.employee.curp,
        start: absence.start,
        end: calendarEnd,
        startDate: absence.start,
        endDate: absence.end,
        type: absence.absence_type.name,
        subtitle: absence.employee.curp,
        description: absence.description || "",
        link: absence.url || "",
        isDeleted: absence.is_deleted,
        usedDays,
        focus: "ausencias",
        scope: "house",
        color: "#F97316",
        lastsAllDay: true,
    };
};

exports.mapEmployeeAbsenceCalendarEvent = (absence, usedDays) => {
    const calendarEnd = new Date(absence.end);
    calendarEnd.setUTCDate(calendarEnd.getUTCDate() + 1);

    const employeeName = [absence.employee?.name, absence.employee?.surname]
        .filter(Boolean)
        .join(" ")
        .trim();

    return {
        absenceId: absence.absence_id,
        employeeId: absence.employee_id,
        name: employeeName || "Ausencia",
        curp: absence.employee?.curp || "",
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

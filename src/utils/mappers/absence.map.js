const {
    calculateMexicoDateRangeDays,
    dateRangeToMexicoCalendarInterval,
} = require("../event/dateTime");

exports.mapHouseAbsenceCalendarEvent = (absence, usedDays) => {
    const { start, end } = dateRangeToMexicoCalendarInterval(
        absence.start,
        absence.end,
    );

    return {
        absenceId: absence.absence_id,
        employeeId: absence.employee.employee_id,
        name: `${absence.employee.name} ${absence.employee.surname}`.trim(),
        curp: absence.employee.curp,
        start,
        end,
        startDate: absence.start,
        endDate: absence.end,
        type: absence.absence_type.name,
        subtitle: absence.employee.curp,
        description: absence.description || "",
        link: absence.url || "",
        isDeleted: absence.is_deleted,
        usedDays,
        totalDays: calculateMexicoDateRangeDays(absence.start, absence.end),
        focus: "ausencias",
        scope: "house",
        color: "#A8201A",
        allDay: true,
    };
};

exports.mapEligibleEmployeeForAbsence = (employee) => {
    if (!employee) return undefined;

    return {
        employeeId: employee.employee_id,
        name: `${employee.name} ${employee.surname}`.trim(),
        picture: employee.picture || null,
    };
};

exports.mapAbsenceType = (absenceType) => {
    if (!absenceType) return undefined;

    return {
        absenceTypeId: absenceType.absence_type_id,
        name: absenceType.name,
    };
};

exports.mapAbsenceDetail = (absence) => {
    if (!absence) return undefined;

    return {
        absenceId: absence.absence_id,
        employeeId: absence.employee?.employee_id,
        absenceTypeId: absence.absence_type_id,
        name: `${absence.employee?.name || ""} ${absence.employee?.surname || ""}`.trim(),
        curp: absence.employee?.curp || "",
        type: absence.absence_type?.name || "",
        description: absence.description || "",
        link: absence.url || "",
        startDate: absence.start,
        endDate: absence.end,
        isDeleted: absence.is_deleted,
    };
};

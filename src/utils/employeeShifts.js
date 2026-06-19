const { randomUUID } = require("crypto");
const { spanishToDay } = require("./dates");

const MIN_SHIFT_MINUTES = 60;
const MAX_SHIFT_MINUTES = 24 * 60;

const NEXT_WORKDAY_NAME = {
    Domingo: "Lunes",
    Lunes: "Martes",
    Martes: "Miércoles",
    Miércoles: "Jueves",
    Jueves: "Viernes",
    Viernes: "Sábado",
    Sábado: "Domingo",
};

const formatTimeFromDb = (time) => {
    if (!time) return "";
    const date = time instanceof Date ? time : new Date(time);
    if (Number.isNaN(date.getTime())) return "";
    return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
};

const parseTimeToMinutes = (time) => {
    if (!time) return 0;

    if (time instanceof Date) {
        return (time.getUTCHours() * 60) + time.getUTCMinutes();
    }

    const match = String(time).match(/(\d{2}):(\d{2})/);
    if (!match) return 0;

    return (Number(match[1]) * 60) + Number(match[2]);
};

const getWorkdayName = (shift, kind) => {
    if (kind === "start") {
        return shift.start_workday?.name
            ?? shift.startWorkday?.name
            ?? shift.startWorkdayName
            ?? shift.name;
    }

    return shift.end_workday?.name
        ?? shift.endWorkday?.name
        ?? shift.endWorkdayName
        ?? shift.name;
};

exports.getNextWorkdayName = (workdayName) => NEXT_WORKDAY_NAME[workdayName] ?? workdayName;

exports.getShiftDurationMinutes = (shift) => {
    if (shift?.is_all_day || shift?.allDay) {
        return MAX_SHIFT_MINUTES;
    }

    const startMinutes = parseTimeToMinutes(shift.start);
    const endMinutes = parseTimeToMinutes(shift.end);
    const startWorkdayName = getWorkdayName(shift, "start");
    const endWorkdayName = getWorkdayName(shift, "end");
    const crossesMidnight = startWorkdayName !== endWorkdayName;

    if (crossesMidnight) {
        return (MAX_SHIFT_MINUTES - startMinutes) + endMinutes;
    }

    if (endMinutes <= startMinutes) {
        return (MAX_SHIFT_MINUTES - startMinutes) + endMinutes;
    }

    return endMinutes - startMinutes;
};

exports.getScheduledWeekdayNumbers = (shifts = []) => {
    const weekdays = new Set();

    shifts.forEach((shift) => {
        const startDay = spanishToDay(getWorkdayName(shift, "start"));
        const endDay = spanishToDay(getWorkdayName(shift, "end"));

        if (startDay >= 0) weekdays.add(startDay);
        if (endDay >= 0) weekdays.add(endDay);
    });

    return [...weekdays].sort((a, b) => a - b);
};

exports.resolveScheduledWeekdayNumbers = (schedule = []) => {
    if (!Array.isArray(schedule) || schedule.length === 0) {
        return [];
    }

    if (typeof schedule[0] === "number") {
        return schedule.filter((day) => day >= 0 && day <= 6);
    }

    if (schedule[0]?.workday?.name && !schedule[0]?.start_workday) {
        return exports.getScheduledWeekdayNumbers(
            schedule.map((workDay) => ({
                start_workday: workDay.workday,
                end_workday: workDay.workday,
            })),
        );
    }

    return exports.getScheduledWeekdayNumbers(schedule);
};

exports.mapShiftToApi = (shift) => ({
    shiftId: shift.shift_id,
    startWorkdayId: shift.start_workday_id,
    endWorkdayId: shift.end_workday_id,
    startWorkdayName: shift.start_workday?.name ?? null,
    endWorkdayName: shift.end_workday?.name ?? null,
    start: formatTimeFromDb(shift.start),
    end: formatTimeFromDb(shift.end),
    allDay: Boolean(shift.is_all_day),
});

exports.mapEmployeeShifts = (employeeShifts) => {
    if (!employeeShifts?.employee_shift) {
        return [];
    }

    return employeeShifts.employee_shift.map((shift) => exports.mapShiftToApi(shift));
};

exports.normalizeShiftInput = (shift) => {
    const allDay = Boolean(shift.allDay);
    const start = allDay ? "00:00" : shift.start;
    const end = allDay ? "00:00" : shift.end;

    return {
        shift_id: randomUUID(),
        start_workday_id: shift.startWorkdayId,
        end_workday_id: shift.endWorkdayId,
        start: new Date(`1970-01-01T${start}:00Z`),
        end: new Date(`1970-01-01T${end}:00Z`),
        is_all_day: allDay,
    };
};

exports.MIN_SHIFT_MINUTES = MIN_SHIFT_MINUTES;
exports.MAX_SHIFT_MINUTES = MAX_SHIFT_MINUTES;

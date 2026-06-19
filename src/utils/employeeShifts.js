const { randomUUID } = require("crypto");

const MIN_SHIFT_MINUTES = 60;
const MAX_SHIFT_MINUTES = 24 * 60;

const SPANISH_TO_DAY = {
    Domingo: 0,
    Lunes: 1,
    Martes: 2,
    Miércoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sábado: 6,
};

const spanishToDay = (day) => SPANISH_TO_DAY[day] ?? -1;

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

exports.normalizeShiftForComparison = (shift) => {
    const allDay = Boolean(shift?.allDay ?? shift?.is_all_day);
    const formatTime = (time) => {
        if (allDay) return "00:00";
        if (time instanceof Date) return formatTimeFromDb(time);
        const match = String(time ?? "").match(/(\d{2}):(\d{2})/);
        return match ? `${match[1]}:${match[2]}` : "";
    };

    return {
        startWorkdayId: String(shift?.startWorkdayId ?? shift?.start_workday_id ?? ""),
        endWorkdayId: String(shift?.endWorkdayId ?? shift?.end_workday_id ?? ""),
        start: formatTime(shift?.start),
        end: formatTime(shift?.end),
        allDay,
    };
};

exports.getShiftSignature = (shift) => {
    const normalized = exports.normalizeShiftForComparison(shift);
    return [
        normalized.startWorkdayId,
        normalized.endWorkdayId,
        normalized.start,
        normalized.end,
        normalized.allDay,
    ].join("|");
};

const getTimeSegments = (shift) => {
    const normalized = exports.normalizeShiftForComparison(shift);

    if (normalized.allDay) {
        return [[0, MAX_SHIFT_MINUTES]];
    }

    const start = parseTimeToMinutes(normalized.start);
    const end = parseTimeToMinutes(normalized.end);

    if (normalized.startWorkdayId === normalized.endWorkdayId && end <= start) {
        return [[start, MAX_SHIFT_MINUTES], [0, end]];
    }

    return [[start, end]];
};

const segmentsOverlap = (segmentsA, segmentsB) => {
    for (const [aStart, aEnd] of segmentsA) {
        for (const [bStart, bEnd] of segmentsB) {
            if (aStart < bEnd && bStart < aEnd) {
                return true;
            }
        }
    }
    return false;
};

exports.shiftsConflict = (shiftA, shiftB) => {
    if (exports.getShiftSignature(shiftA) === exports.getShiftSignature(shiftB)) {
        return true;
    }

    const a = exports.normalizeShiftForComparison(shiftA);
    const b = exports.normalizeShiftForComparison(shiftB);

    if (a.startWorkdayId !== a.endWorkdayId || b.startWorkdayId !== b.endWorkdayId) {
        return false;
    }

    if (a.startWorkdayId !== b.startWorkdayId) {
        return false;
    }

    return segmentsOverlap(getTimeSegments(shiftA), getTimeSegments(shiftB));
};

const getWorkdayLabel = (workdayId, catalog = []) => {
    const match = catalog.find(
        (day) => String(day.workdayId ?? day.workday_id) === String(workdayId),
    );
    return match?.name ?? "turno";
};

const describeShift = (shift, catalog = []) => {
    const normalized = exports.normalizeShiftForComparison(shift);
    const dayName = getWorkdayLabel(normalized.startWorkdayId, catalog);

    if (normalized.allDay) {
        return `${dayName} (24 horas)`;
    }

    if (normalized.startWorkdayId !== normalized.endWorkdayId) {
        const endDayName = getWorkdayLabel(normalized.endWorkdayId, catalog);
        return `${dayName} ${normalized.start}–${normalized.end} (${endDayName})`;
    }

    return `${dayName} ${normalized.start}–${normalized.end}`;
};

exports.findShiftConflictMessage = (shifts = [], workdayCatalog = []) => {
    for (let i = 0; i < shifts.length; i += 1) {
        for (let j = i + 1; j < shifts.length; j += 1) {
            if (!exports.shiftsConflict(shifts[i], shifts[j])) {
                continue;
            }

            const signatureA = exports.getShiftSignature(shifts[i]);
            const signatureB = exports.getShiftSignature(shifts[j]);

            if (signatureA === signatureB) {
                return `No puedes repetir el mismo turno (${describeShift(shifts[i], workdayCatalog)}).`;
            }

            return `Hay turnos que se solapan el ${describeShift(shifts[i], workdayCatalog)}.`;
        }
    }

    return null;
};

exports.MIN_SHIFT_MINUTES = MIN_SHIFT_MINUTES;
exports.MAX_SHIFT_MINUTES = MAX_SHIFT_MINUTES;

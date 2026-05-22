const RESPONSES = require("../responses");
const { ROLES } = require("../roles");

const ALL_DAY_START = "00:00:00";
const ALL_DAY_END = "00:00:00";

exports.addOneDay = (date) => {
    const nextDate = new Date(`${date}T00:00:00.000Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    return nextDate.toISOString().slice(0, 10);
};

exports.resolveEmployeeIds = (user, employeeIdsInput, forceOverlap) => {
    if (user.role === ROLES.COORDINATOR) {
        if (!Array.isArray(employeeIdsInput) || employeeIdsInput.length === 0) {
            return { code: RESPONSES.EMPLOYEE.NOT_PROVIDED };
        }
        return { employeeIds: [...new Set(employeeIdsInput)] };
    }
    if (forceOverlap === true) {
        return { code: RESPONSES.USER.NOT_ACCESS };
    }
    return { employeeIds: [user.id] };
};

exports.resolveSchedule = (allDay, startInput, endInput) => {
    if (allDay === true) {
        return { start: ALL_DAY_START, end: ALL_DAY_END };
    }
    const normalizedStart =
        startInput && startInput.length === 5
            ? `${startInput}:00`
            : (startInput ?? ALL_DAY_START);
    const normalizedEnd =
        endInput && endInput.length === 5
            ? `${endInput}:00`
            : (endInput ?? ALL_DAY_END);
    return { start: normalizedStart, end: normalizedEnd };
};

exports.getOverlapError = (user, overlappedEmployees, forceOverlap) => {
    if (overlappedEmployees.length === 0) return null;
    if (user.role !== ROLES.COORDINATOR || forceOverlap !== true) {
        return {
            code: RESPONSES.EVENTS.OVERLAP,
            data: { overlappedEmployees },
        };
    }
    return null;
};

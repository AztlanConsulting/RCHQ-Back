const { VACATION_STATUS } = require("../vacationStatus");

function toUtcDateOnly(date) {
    return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
}

function getTodayUTC() {
    return toUtcDateOnly(new Date());
}

function canRemoveVacationRequest(
    vacationRequest,
    currentDate = getTodayUTC(),
) {
    if (vacationRequest.status !== VACATION_STATUS.APPROVED) {
        return true;
    }

    return toUtcDateOnly(vacationRequest.start) > toUtcDateOnly(currentDate);
}

module.exports = {
    toUtcDateOnly,
    getTodayUTC,
    canRemoveVacationRequest,
};

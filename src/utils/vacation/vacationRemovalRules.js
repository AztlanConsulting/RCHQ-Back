const { VACATION_STATUS } = require("../vacationStatus");
const { convertUTCToMexicanTime, getUTCDateKey } = require("../dates");

function toUtcDateOnly(date) {
    return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
}

function getTodayUTC() {
    return toUtcDateOnly(new Date());
}

function getTodayMexicoDate() {
    return toUtcDateOnly(convertUTCToMexicanTime(new Date()));
}

function canRemoveVacationRequest(
    vacationRequest,
    currentDate = getTodayMexicoDate(),
) {
    if (vacationRequest.status !== VACATION_STATUS.APPROVED) {
        return true;
    }

    return getUTCDateKey(vacationRequest.start) > getUTCDateKey(currentDate);
}

module.exports = {
    toUtcDateOnly,
    getTodayUTC,
    getTodayMexicoDate,
    canRemoveVacationRequest,
};

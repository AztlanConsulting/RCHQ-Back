const { VACATION_STATUS } = require("../vacationStatus");
const { getMexicoTodayDate, getUTCDateKey } = require("../dates");

const hasDateStartedInMexico = (
    date,
    currentDate = getMexicoTodayDate(),
) => getUTCDateKey(date) <= getUTCDateKey(currentDate);

exports.getTodayMexicoDate = getMexicoTodayDate;

exports.canRemoveVacationRequest = (
    vacationRequest,
    currentDate = getMexicoTodayDate(),
) => {
    if (vacationRequest.status !== VACATION_STATUS.APPROVED) {
        return true;
    }

    return !hasDateStartedInMexico(vacationRequest.start, currentDate);
};

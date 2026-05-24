const { VACATION_STATUS } = require("../vacationStatus");

exports.toUtcDateOnly = (date) => {
    return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
};

exports.getTodayUTC = () => {
    return exports.toUtcDateOnly(new Date());
};

exports.canRemoveVacationRequest = (
    vacationRequest,
    currentDate = exports.getTodayUTC(),
) => {
    if (vacationRequest.status !== VACATION_STATUS.APPROVED) {
        return true;
    }

    return (
        exports.toUtcDateOnly(vacationRequest.start) >
        exports.toUtcDateOnly(currentDate)
    );
};

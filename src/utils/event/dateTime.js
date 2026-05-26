const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const DATETIME_WITH_TIMEZONE_REGEX =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

const MEXICO_TIMEZONE_OFFSET = "-06:00";

const normalizeTime = (value) => {
    if (!value) return "00:00:00";
    return value.length === 5 ? `${value}:00` : value;
};

exports.isTimeOnly = (value) =>
    typeof value === "string" && TIME_REGEX.test(value);

exports.isDateTimeWithTimezone = (value) =>
    typeof value === "string" && DATETIME_WITH_TIMEZONE_REGEX.test(value);

exports.eventDateTimeToUtc = (date, value) => {
    if (value instanceof Date) return value;

    if (exports.isDateTimeWithTimezone(value)) {
        return new Date(value);
    }

    return new Date(
        `${date}T${normalizeTime(value)}${MEXICO_TIMEZONE_OFFSET}`,
    );
};

exports.endOfUtcDay = (date) => {
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);
    return end;
};

exports.isDateOrDateTimeWithTimezone = (value) =>
    typeof value === "string" &&
    (/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        DATETIME_WITH_TIMEZONE_REGEX.test(value));

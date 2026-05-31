const { convertUTCToMexicanTime } = require("../dates");

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const DATETIME_WITH_TIMEZONE_REGEX =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TEXT_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s\-!¿¡?.,:;()]+$/;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const MEXICO_TIMEZONE_OFFSET = "-06:00";

exports.TIME_REGEX = TIME_REGEX;
exports.DATETIME_WITH_TIMEZONE_REGEX = DATETIME_WITH_TIMEZONE_REGEX;
exports.DATE_ONLY_REGEX = DATE_ONLY_REGEX;
exports.TEXT_REGEX = TEXT_REGEX;
exports.MEXICO_TIMEZONE_OFFSET = MEXICO_TIMEZONE_OFFSET;
exports.ONE_DAY_MS = ONE_DAY_MS;

exports.normalizeTime = (value) => {
    if (!value) return "00:00:00";
    const [h, m, s] = value.split(":");
    return [
        h.padStart(2, "0"),
        (m || "00").padStart(2, "0"),
        (s || "00").padStart(2, "0")
    ].join(":");
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
        `${date}T${exports.normalizeTime(value)}${MEXICO_TIMEZONE_OFFSET}`,
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

const toUtcDateOnly = (date) =>
    [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
    ].join("-");

exports.dateOnlyToMexicoUtcStart = (date) =>
    new Date(`${toUtcDateOnly(date)}T06:00:00.000Z`);

exports.dateOnlyToMexicoUtcEnd = (date) => {
    const end = exports.dateOnlyToMexicoUtcStart(date);
    end.setUTCDate(end.getUTCDate() + 1);
    return end;
};

exports.dateRangeToMexicoCalendarInterval = (startDate, endDate) => {
    const start = exports.dateOnlyToMexicoUtcStart(startDate);
    const end = exports.dateOnlyToMexicoUtcEnd(endDate);

    return { start, end };
};

exports.calculateMexicoDateRangeDays = (startDate, endDate) => {
    const start = new Date(`${toUtcDateOnly(startDate)}T00:00:00.000Z`);
    const end = new Date(`${toUtcDateOnly(endDate)}T00:00:00.000Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    return Math.round((end - start) / 86400000) + 1;
};

exports.getTodayStr = () => convertUTCToMexicanTime(new Date()).toISOString().slice(0, 10);

exports.getMaxDateStr = () => {
    const d = convertUTCToMexicanTime(new Date());
    d.setUTCFullYear(d.getUTCFullYear() + 2);
    return d.toISOString().slice(0, 10);
};

exports.getHouseMinDateStr = () => {
    const year = convertUTCToMexicanTime(new Date()).getUTCFullYear();
    return `${year}-01-01`;
};

exports.getHouseMaxDateStr = () => {
    const year = convertUTCToMexicanTime(new Date()).getUTCFullYear() + 2;
    return `${year}-12-31`;
};

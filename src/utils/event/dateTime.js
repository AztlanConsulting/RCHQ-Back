const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const DATETIME_WITH_TIMEZONE_REGEX =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

const MEXICO_TIMEZONE_OFFSET = "-06:00";
const MEXICO_TIME_ZONE = "America/Mexico_City";
exports.MEXICO_TIME_ZONE = MEXICO_TIME_ZONE;

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

const toUtcDateOnly = (date) =>
    [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
    ].join("-");

exports.dateOnlyToMexicoUtcStart = (date) =>
    new Date(`${toUtcDateOnly(date)}T06:00:00.000Z`);

exports.dateOnlyToMexicoUtcEnd = (date) =>
    new Date(`${toUtcDateOnly(date)}T05:59:59.999Z`);

exports.dateRangeToMexicoCalendarInterval = (startDate, endDate) => {
    const start = exports.dateOnlyToMexicoUtcStart(startDate);
    const end = exports.dateOnlyToMexicoUtcEnd(endDate);
    end.setUTCDate(end.getUTCDate() + 1);

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

exports.resolveCalendarTimeZone = (timeZone) => {
    if (!timeZone) return MEXICO_TIME_ZONE;

    try {
        Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
        return timeZone;
    } catch {
        return MEXICO_TIME_ZONE;
    }
};

const getTimePartsInZone = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(date);

    return Object.fromEntries(
        parts
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, Number(part.value)]),
    );
};

exports.isAllDayInTimeZone = (start, end, timeZone = MEXICO_TIME_ZONE) => {
    if (!(start instanceof Date) || !(end instanceof Date)) return false;

    const startParts = getTimePartsInZone(start, timeZone);
    const endParts = getTimePartsInZone(end, timeZone);

    const startsAtMidnight =
        startParts.hour === 0 &&
        startParts.minute === 0 &&
        startParts.second === 0;
    const endsAtMidnight =
        endParts.hour === 0 &&
        endParts.minute === 0 &&
        endParts.second === 0;
    const endsAtLastMinute =
        endParts.hour === 23 && endParts.minute === 59;

    return startsAtMidnight && (endsAtMidnight || endsAtLastMinute);
};

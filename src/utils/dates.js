const MEXICO_TIME_OFFSET_MS = 6 * 60 * 60 * 1000;
exports.convertUTCToMexicanTime = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp.getTime() - MEXICO_TIME_OFFSET_MS);
};

exports.getUTCDateKey = (date) =>
    date.getUTCFullYear() * 10000 +
    (date.getUTCMonth() + 1) * 100 +
    date.getUTCDate();

exports.getMexicoTodayDateKey = () => {
    const todayInMexico = this.convertUTCToMexicanTime(new Date());

    return this.getUTCDateKey(todayInMexico);
};

exports.getMexicoTodayDate = () => {
    const todayInMexico = this.convertUTCToMexicanTime(new Date());

    return new Date(Date.UTC(
        todayInMexico.getUTCFullYear(),
        todayInMexico.getUTCMonth(),
        todayInMexico.getUTCDate(),
    ));
};

exports.hasDateStartedInMexico = (date) =>
    this.getUTCDateKey(date) <= this.getMexicoTodayDateKey();

exports.combineDateAndTime = (date, time) => {
    const mexicanTime = this.convertUTCToMexicanTime(time);

    const day = date.getUTCDate();
    const month = date.getUTCMonth();
    const year = date.getUTCFullYear();
    const hour = mexicanTime.getUTCHours();
    const minute = mexicanTime.getUTCMinutes();

    const combined = new Date(Date.UTC(year, month, day, hour, minute, 0));

    return combined;
};

exports.spanishToDay = (day) => {
    switch (day) {
        case "Domingo":
            return 0;
        case "Lunes":
            return 1;
        case "Martes":
            return 2;
        case "Miércoles":
            return 3;
        case "Jueves":
            return 4;
        case "Viernes":
            return 5;
        case "Sábado":
            return 6;
    }
    return -1;
};

const isUtcMidnight = (date) =>
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

exports.getLastIncludedDateForRange = (startDate, endDate) => {
    const effectiveEndDate =
        endDate > startDate && isUtcMidnight(endDate)
            ? new Date(endDate.getTime() - 1)
            : endDate;

    return new Date(
        Date.UTC(
            effectiveEndDate.getUTCFullYear(),
            effectiveEndDate.getUTCMonth(),
            effectiveEndDate.getUTCDate(),
        ),
    );
};

exports.calculateUsedDays = (workDays, startDate, endDate, events = []) => {
    const days = [];
    workDays.forEach((workDay) => {
        days.push(this.spanishToDay(workDay.workday.name));
    });

    const freeDays = [];

    events.forEach(event => {
        if (!event.isFreeDay) {
            return;
        }

        const eventStart = event.start;
        const eventEnd = event.end;

        if (!eventStart || !eventEnd) {
            return;
        }

        let currentEventDay = new Date(
            Date.UTC(
                eventStart.getUTCFullYear(),
                eventStart.getUTCMonth(),
                eventStart.getUTCDate(),
            ),
        );
        const lastEventDay = this.getLastIncludedDateForRange(eventStart, eventEnd);

        while (currentEventDay <= lastEventDay) {
            const eventDate = currentEventDay.toISOString().split("T")[0];
            const eventDay = currentEventDay.getUTCDay();

            if (
                currentEventDay >= startDate &&
                currentEventDay <= endDate &&
                days.includes(eventDay) &&
                !freeDays.includes(eventDate)
            ) {
                freeDays.push(eventDate);
            }

            currentEventDay.setUTCDate(currentEventDay.getUTCDate() + 1);
        }
    });
    let usedDays = 0;

    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
        const currentNumber = currentDay.getUTCDay();
        if (days.includes(currentNumber)) {
            usedDays += 1;
        }
        currentDay.setUTCDate(currentDay.getUTCDate() + 1);
    }

    return usedDays - freeDays.length;
};

exports.stringToDate = (rawDate) => {
    const dateElements = rawDate.split("-");

    const year = Number(dateElements[0]);
    const month = Number(dateElements[1]);
    const day = Number(dateElements[2]);

    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return parsedDate;
};

exports.isValidDate = (rawDate) => {
    const dateElements = rawDate.split("-");

    const year = Number(dateElements[0]);
    const month = Number(dateElements[1]);
    const day = Number(dateElements[2]);

    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
        parsedDate.getUTCFullYear() == year &&
        parsedDate.getUTCMonth() == month - 1 &&
        parsedDate.getUTCDate() == day
    );
};

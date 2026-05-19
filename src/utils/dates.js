exports.combineDateAndTime = (date, time) => {
    const day = date.getUTCDate();
    const month = date.getUTCMonth();
    const year = date.getUTCFullYear();
    const hour = time.getUTCHours() - 6;
    const minute = time.getUTCMinutes();

    const combined = new Date(Date.UTC(year, month, day, hour, minute, 0));
    
    return combined;
}

exports.convertUTCToMexicanTime = (timestamp) => {
    const day = timestamp.getUTCDate();
    const month = timestamp.getUTCMonth();
    const year = timestamp.getUTCFullYear();
    const hour = timestamp.getUTCHours() - 6;
    const minute = timestamp.getUTCMinutes();

    const combined = new Date(Date.UTC(year, month, day, hour, minute, 0));
    
    return combined;
}


exports.spanishToDay = (day) => {
    switch (day) {
        case "Domingo":
            return 0;
        case "Lunes":
            return 1
        case "Martes":
            return 2
        case "Miércoles":
            return 3
        case "Jueves":
            return 4
        case "Viernes":
            return 5
        case "Sábado":
            return 6
    }
    return -1
}

exports.calculateUsedDays = (workDays, startDate, endDate, events = []) => {
    const days = [];
    workDays.forEach(workDay => {
        days.push(this.spanishToDay(workDay.workday.name))
    });

    const freeDays = [];
    
    events.forEach(event => {
        if (event.isFreeDay !== true) {
            return;
        }

        const eventStart = event.start;
        const eventEnd =  event.end;

        if (!eventStart || !eventEnd) {
            throw new Error("No se encontraron fechas válidas para el evento");
        }

        let currentEventDay = new Date(Date.UTC(
            eventStart.getUTCFullYear(),
            eventStart.getUTCMonth(),
            eventStart.getUTCDate()
        ));
        const lastEventDay = new Date(Date.UTC(
            eventEnd.getUTCFullYear(),
            eventEnd.getUTCMonth(),
            eventEnd.getUTCDate()
        ));

        while (currentEventDay <= lastEventDay) {
            const eventDate = currentEventDay.toISOString().split("T")[0];
            const eventDay = currentEventDay.getUTCDay();

            if (
                currentEventDay >= startDate &&
                currentEventDay <= endDate &&
                days.includes(eventDay) &&
                !freeDays.includes(eventDate)
            ) {
                freeDays.push(eventDate)
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
}

exports.stringToDate = (rawDate) => {
    const dateElements = rawDate.split("-");

    const year = Number(dateElements[0]);
    const month = Number(dateElements[1]);
    const day = Number(dateElements[2]);
    
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return parsedDate;
}

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
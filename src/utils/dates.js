exports.combineDateAndTime = (date, time) => {
    const day = date.getUTCDate();
    const month = date.getUTCMonth();
    const year = date.getUTCFullYear();
    const hour = time.getUTCHours();
    const minute = time.getUTCMinutes();

    const combined = new Date(Date.UTC(year, month, day, hour, minute, 0));
    
    return combined;
}

exports.toUTC = (date) => {
    return new Date(date.toISOString());
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

exports.calculateUsedDays = (workDays, startDate, endDate, events) => {
    const days = [];
    workDays.forEach(workDay => {
        days.push(this.spanishToDay(workDay.workday.name))
    });

    const freeDays = [];
    
    events.forEach(event => {
        const eventDay = event.date.getUTCDay();
        const eventDate =event.date.toISOString().split("T")[0];
        if (event.is_free_day == true && days.includes(eventDay) && !freeDays.includes(eventDate)) {
            freeDays.push(eventDate)
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
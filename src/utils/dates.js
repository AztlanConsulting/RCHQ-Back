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

exports.calculateUsedDays = (workDays, startDate, endDate) => {
    
}
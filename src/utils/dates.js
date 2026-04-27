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
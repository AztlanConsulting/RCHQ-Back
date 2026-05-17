exports.getNaturalDays = (startDate, endDate) => {
    const msPerDay = 24 * 60 * 60 * 1000;

    const start = Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
    );

    const end = Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
    );

    return Math.floor((end - start) / msPerDay) + 1;
};

const futureDate = (daysFromNow) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + daysFromNow);
    return d.toISOString().slice(0, 10);
};

const futureDatetime = (daysFromNow, hour) =>
    `${futureDate(daysFromNow)}T${String(hour).padStart(2, "0")}:00:00-06:00`;

const futureDatetimeUtc = (daysFromNow, hour) =>
    new Date(futureDatetime(daysFromNow, hour)).toISOString();

const allDayEndUtc = (daysFromNow) => {
    const d = new Date(`${futureDate(daysFromNow)}T06:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString();
};

module.exports = { futureDate, futureDatetime, futureDatetimeUtc, allDayEndUtc };

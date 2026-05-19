const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

exports.isRealISODate = (dateString) => {
    if (!ISO_DATE_REGEX.test(dateString)) return false;

    const [year, month, day] = dateString.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
};

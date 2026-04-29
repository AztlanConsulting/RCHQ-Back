exports.getCurrentWorkYearRange = (employeeStartDate, referenceDate = new Date()) => {
    const baseDay = employeeStartDate.getUTCDate();
    const baseMonth = employeeStartDate.getUTCMonth();

    const currentYear = referenceDate.getUTCFullYear();

    const anniversaryThisYear = new Date(Date.UTC(currentYear, baseMonth, baseDay));

    let workYearStart;
    let workYearEnd;

    if (referenceDate >= anniversaryThisYear) {
        workYearStart = anniversaryThisYear;
        workYearEnd = new Date(Date.UTC(currentYear + 1, baseMonth, baseDay));
    } else {
        workYearStart = new Date(Date.UTC(currentYear - 1, baseMonth, baseDay));
        workYearEnd = anniversaryThisYear;
    }

    return {
        workYearStart,
        workYearEnd,
    };
};
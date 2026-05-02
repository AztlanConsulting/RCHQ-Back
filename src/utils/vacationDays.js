exports.getVacationDays = (years) => {
    years -= 1;
    if (years <= 5) return 12 + (years) * 2;

    const remainingYears = years - 5;
    const fiveYearBlocks = Math.floor((remainingYears) / 5 + 1);

    return fiveYearBlocks * 2 + 20;
}
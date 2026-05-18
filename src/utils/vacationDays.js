exports.getVacationDays = (years) => {
    if (years <= 0) return 0;

    if (years <= 5) {
        return 12 + (years - 1) * 2;
    }

    const extraBlocks = Math.floor((years - 6) / 5);
    return 22 + extraBlocks * 2;
};

exports.absencePolicy = (user, resource) => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    if (user.role === "Coordinador" && resource?.houseId == user.houseId) {
        return true;
    }
    return false;
};

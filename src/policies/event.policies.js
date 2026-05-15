exports.houseEventPolicy = (user, resource) => {
    if (!user) return false;
    const privileges = user.privileges || [];
    if (!privileges.includes("createEvent")) return false;
    if (user.role === "Admin") return true;
    if (user.role === "Coordinador") {
        if (resource?.houseId && resource.houseId !== user.houseId) {
            return false;
        }
        return true;
    }
    return false;
};

exports.deactivateEmployeePolicy = (user, resource) => {
    if (!user) return false;

    if (resource.addToBlacklist && !user.privileges?.includes("addToBlacklist")) {
        return false;
    }

    if (user.role === "Admin") return true;
    if (user.role === "Coordinador") return user.houseId === resource.houseId;
    return false;
};

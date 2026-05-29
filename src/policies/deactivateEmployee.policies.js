exports.deactivateEmployeePolicy = (user, resource) => {
    if (!user) return false;

    if (!resource) return true;

    if (resource.addToBlacklist && !user.privileges?.includes("addToBlacklist")) {
        return false;
    }

    if (user.role === "Administrador") return true;
    if (user.role === "Coordinador") return user.houseId === resource.houseId;
    return false;
};

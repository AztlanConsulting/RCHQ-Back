exports.deactivateEmployeePolicy = (user, resource) => {
    if (!user) return false;

    // Si el empleado no existe, dejamos pasar para que el controller lance el 404 Not Found
    if (!resource) return true;

    if (resource.addToBlacklist && !user.privileges?.includes("addToBlacklist")) {
        return false;
    }

    if (user.role === "Administrador") return true;
    if (user.role === "Coordinador") return user.houseId === resource.houseId;
    return false;
};

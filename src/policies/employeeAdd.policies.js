const createEmployeePolicy = (user, resource) => {
    if (!user) return false;

    if (user.role === "Administrador") return true;

    if (user.role === "Coordinador") {
        return user.house_id === resource.house_id;
    }

    return false;
};

module.exports = {
    createEmployeePolicy,
};

const createEmployeePolicy = (user) => {
    if (!user) return false;

    if (user.role === "Administrador") return true;

    if (user.role === "Coordinador") return true;

    return false;
};

module.exports = {
    createEmployeePolicy,
};

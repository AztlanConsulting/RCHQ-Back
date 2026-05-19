const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");

exports.houseEventPolicy = (user, resource) => {
    if (!user) return false;
    const privileges = user.privileges || [];
    if (!privileges.includes(PRIVILEGES.CREATE_EVENT)) return false;
    if (user.role === ROLES.ADMIN) return true;
    if (user.role === ROLES.COORDINATOR) {
        if (resource?.houseId && resource.houseId !== user.houseId) {
            return false;
        }
        return true;
    }
    return false;
};

exports.personalEventPolicy = (user, resource) => {
    if (!user) return false;
    const privileges = user.privileges || [];
    if (!privileges.includes(PRIVILEGES.CREATE_EVENT)) return false;
    if (!user.houseId) return false;
    if (resource?.houseId && resource.houseId !== user.houseId) return false;
    if (resource?.forceOverlap === true && user.role !== ROLES.COORDINATOR) {
        return false;
    }
    if (user.role === ROLES.COORDINATOR) return true;
    return Boolean(user.id);
};

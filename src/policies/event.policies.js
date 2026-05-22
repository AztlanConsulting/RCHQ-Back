const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");

const coordinatorPolicy = (privilege) => (user, resource) => {
    if (!user) return false;
    if (!(user.privileges || []).includes(privilege)) return false;
    if (user.role !== ROLES.COORDINATOR) return false;
    if (resource?.houseId && resource.houseId !== user.houseId) return false;
    return true;
};

exports.houseEventPolicy = coordinatorPolicy(PRIVILEGES.CREATE_EVENT);
exports.updateHouseEventPolicy = coordinatorPolicy(PRIVILEGES.EDIT_EVENT);
exports.deleteHouseEventPolicy = coordinatorPolicy(PRIVILEGES.DELETE_EVENT);
exports.updatePersonalEventPolicy = coordinatorPolicy(PRIVILEGES.EDIT_EVENT);
exports.deletePersonalEventPolicy = coordinatorPolicy(PRIVILEGES.DELETE_EVENT);

exports.personalEventPolicy = (user, resource) => {
    if (!user) return false;
    if (!(user.privileges || []).includes(PRIVILEGES.CREATE_EVENT))
        return false;
    if (!user.houseId) return false;
    if (resource?.houseId && resource.houseId !== user.houseId) return false;
    if (resource?.forceOverlap === true && user.role !== ROLES.COORDINATOR)
        return false;
    if (user.role === ROLES.COORDINATOR) return true;
    return Boolean(user.id);
};

const { ROLES } = require("../utils/roles");

exports.modifyVacationRequestDates = (user, resource) => {
    if (!user) return false;
    if (resource?.employeeId === user.id) return true;
    if (
        user.role === ROLES.COORDINATOR &&
        resource?.houseId === user.houseId
    ) {
        return true;
    }

    return false;
};

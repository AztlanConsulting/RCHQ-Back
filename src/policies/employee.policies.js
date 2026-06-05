const { ROLES, DOCUMENT_VIEWER_ROLES } = require("../utils/roles");

exports.employeePolicy = (user, resource) => {
  if (!user) return false;
  if (user.role === "Administrador") return true;
  if (user.role === "Coordinador") {
    if (resource?.houseId && resource.houseId != user.houseId) return false;
    return true;
  }
  return false;
};

exports.viewDocuments = (user, resource) => {
  if (!user) return false;
  if (resource?.employeeId == user.id) return true;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.COORDINATOR && resource?.houseId == user.houseId) return true;
  if (DOCUMENT_VIEWER_ROLES.includes(user.role) && resource?.houseId == user.houseId) return true;
  return false;
};

exports.viewTrainings = (user, resource) => {
  if (!user) return false;
  if (resource?.employeeId == user.id) return true;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.COORDINATOR && resource?.houseId == user.houseId) return true;
  return false;
};

exports.modifyDocuments = (user, resource) => {
  if (!user) return false;
  if (user.role === "Administrador") return true;
  if (user.role === "Coordinador" && resource?.houseId == user.houseId) return true;
  return false;
};

exports.modifyEmployee = (user, resource) => {
  if (!user) return false;
  if (user.role === "Administrador") return true;
  if (user.role === "Coordinador" && resource?.houseId == user.houseId) return true;
  return false;
};

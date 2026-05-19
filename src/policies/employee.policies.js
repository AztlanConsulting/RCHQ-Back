// employee.policies.js

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
  if (user.role === "Administrador") return true;
  if (user.role === "Coordinador" && resource?.houseId == user.houseId) return true;
  if (resource?.employeeId == user.id) return true;
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
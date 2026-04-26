const createEmployeePolicy = (user) => {
  if (!user) return false;

  if (user.role === "Administrador") return true;

  if (user.role === "Coordinador") return true;

  return false;
};

const viewDocuments = (user, resource) => {
  if (user.role === "Administradora" || user.role === "Coordinadora")
    return true;
  if (resource?.employeeId == user.userId) return true;
  return false;
};

const modifyDocuments = (user) => {
  return user.role === "Administradora" || user.role === "Coordinadora";
};

module.exports = {
  createEmployeePolicy,
  viewDocuments,
  modifyDocuments,
};

const employeePolicy = (user) => {
    if (!user) return false;

    if (user.role === "Administrador") return true;

    if (user.role === "Coordinador") return true;

    return false;
};


const viewDocuments = (user, resource) => {
  if (user.role === "Administrador" || user.role === "Coordinador") return true;
  if (resource?.employeeId == user.id) return true;
  return false;
};

const modifyDocuments = (user) => {
  return user.role === "Administrador" || user.role === "Coordinador";
};

module.exports = {
  employeePolicy,
  viewDocuments,
  modifyDocuments,
};

exports.employeePolicy = (user) => {
  if (!user) return false;

  if (user.role === "Admin") return true;

  if (user.role === "Coordinador") return true;

  return false;
};

exports.viewDocuments = (user, resource) => {
  if (user.role === "Admin" || user.role === "Coordinador") return true;
  if (resource?.employeeId == user.id) return true;
  return false;
};

exports.modifyDocuments = (user) => {
  return user.role === "Admin" || user.role === "Coordinador";
};

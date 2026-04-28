exports.deactivateEmployeePolicy = (user, resource) => {
  if (!user) return false;
  if (user.role === "Administrador") return true;
  if (user.role === "Coordinador") return user.houseId === resource.houseId;
  return false;
};
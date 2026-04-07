const adminPolicy = (user, resource) => {
  if (user.role === "admin") return true;

  if (user.role === "coordinator") {
    if (resource.coordinators.includes(user.id)) return true;
  }

  return false;
};

module.exports = {
  adminPolicy,
};

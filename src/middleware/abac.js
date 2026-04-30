const { getHome } = require("../model/employee/consult.model");

const canAccess = (user, policyFn, resource) => {
  if (!user) return false;
  return policyFn(user, resource);
};

const authorize = (policyFn, getResource) => async (req, res, next) => {
  try {
    const resource =
      typeof getResource === "function" ? await getResource(req) : getResource;

    if (canAccess(req.user, policyFn, resource)) {
      return next();
    }

    return res.status(403).json({ error: "Acceso denegado" });
  } catch (error) {
    console.error("error en authorize: ", error);
    return res.status(500).json({ message: "Error del servidor"});
  }
};

const isAllowed = async (req, res, next) => {
    try {
        if (req.user.role == "admin") return next();
        if (req.user.id == req.params.id) return next();

        // Verifica sea coordinador y de la misma casa
        const homeQuery = await getHome(req.params.id);
        if (!homeQuery) return res.status(500).json({ error: "Error del servidor" });
        if (req.user.houseId == homeQuery.house_id && req.user.role == "coordinator") {
            return next();
        }

        return res.status(500).json({ error: "Error del servidor" });
    } catch {
        return res.status(500).json({ error: "Error del servidor" });
    }
};

module.exports = {
    authorize,
    canAccess,
    isAllowed,
};

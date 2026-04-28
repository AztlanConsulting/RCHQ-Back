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
  } catch {
    return res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  authorize,
  canAccess,
};

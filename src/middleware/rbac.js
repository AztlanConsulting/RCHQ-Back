const { allRoles } = require("../utils/roles");

const requirePrivileges = (...requiredPrivileges) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res
                    .status(401)
                    .json({ message: "Usuario no autenticado" });
            }

            const userPrivileges = req.user.privileges || [];

            const hasAllPrivileges = requiredPrivileges.every((privilege) =>
                userPrivileges.includes(privilege),
            );

            if (!hasAllPrivileges) {
                return res
                    .status(403)
                    .json({ message: "Permisos insuficientes" });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

const requireAnyPrivilege = (...requiredPrivileges) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res
                    .status(401)
                    .json({ message: "Usuario no autenticado" });
            }

            const userPrivileges = req.user.privileges || [];

            const hasAnyPrivilege = requiredPrivileges.some((privilege) =>
                userPrivileges.includes(privilege),
            );

            if (!hasAnyPrivilege) {
                return res
                    .status(403)
                    .json({ message: "Permisos insuficientes" });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Permisos insuficientes" });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
    allRoles,
    requirePrivileges,
    requireAnyPrivilege,
    requireRole,
};

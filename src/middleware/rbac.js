const requirePrivileges = (...requiredPrivileges) => {
    return (req, res, next) => {
        try {
            // User should be attached by auth.middleware
            if (!req.user) {
                return res
                    .status(401)
                    .json({ message: "User not authenticated" });
            }

            const userPrivileges = req.user.privileges || [];

            // Check if user has all required privileges
            const hasAllPrivileges = requiredPrivileges.every((privilege) =>
                userPrivileges.includes(privilege),
            );

            if (!hasAllPrivileges) {
                return res
                    .status(403)
                    .json({ message: "Insufficient privileges" });
            }

            next();
        } catch (error) {
            // Pass error to the next middleware
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
                    .json({ message: "User not authenticated" });
            }

            const userPrivileges = req.user.privileges || [];

            // Check if user has at least one required privilege
            const hasAnyPrivilege = requiredPrivileges.some((privilege) =>
                userPrivileges.includes(privilege),
            );

            if (!hasAnyPrivilege) {
                return res
                    .status(403)
                    .json({ message: "Insufficient privileges" });
            }

            next();
        } catch (error) {
            // Pass error to the next middleware
            next(error);
        }
    };
};

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                console.log(req.user);
                return res
                    .status(401)
                    .json({ message: "User not authenticated" });
            }

            if (!allowedRoles.includes(req.user.role)) {
                console.log(req.user.role);
                return res.status(403).json({ message: "Role not allowed" });
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    requirePrivileges,
    requireAnyPrivilege,
    requireRole,
};

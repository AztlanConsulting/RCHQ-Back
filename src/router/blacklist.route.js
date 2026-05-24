const express = require("express");
const router = express.Router();
const { apiLimiter } = require("../utils/rateLimit");
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { canAddToBlacklist, canRemoveFromBlacklist } = require("../middleware/abac");
const {
    insertIntoBlacklist,
} = require("../controller/blacklist/create.controller");
const { getBlacklist } = require("../controller/blacklist/get.controller");
const { removeFromBlacklistController } = require("../controller/blacklist/delete.controller");
const validate = require("../middleware/validate");
const { blacklistCreateSchema } = require("../schemas/blacklist/create.schemas");
const { blacklistDeleteSchema } = require("../schemas/blacklist/delete.schemas");
const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");

router.get(
    "/",
    verifyToken,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.VIEW_BLACKLIST),
    getBlacklist
);

router.post(
    "/",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.ADD_TO_BLACKLIST),
    validate(blacklistCreateSchema),
    canAddToBlacklist,
    insertIntoBlacklist
);

router.patch(
    "/delete",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.REMOVE_FROM_BLACKLIST),
    validate(blacklistDeleteSchema),
    canRemoveFromBlacklist,
    removeFromBlacklist
);

module.exports = router;
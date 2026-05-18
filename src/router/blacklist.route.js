const express = require("express");
const router = express.Router();
const { apiLimiter } = require("../utils/rateLimit");
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { canAddToBlacklist } = require("../middleware/abac");
const { insertIntoBlacklist } = require("../controller/blacklist/create.controller");
const validate = require("../middleware/validate");
const { blacklistCreateSchema } = require("../schemas/blacklist/create.schemas");
const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");

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

module.exports = router;
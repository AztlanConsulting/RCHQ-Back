const express = require("express");
const router = express.Router();
const { apiLimiter } = require("../utils/rateLimit");
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { canAddToBlacklist, canRemoveFromBlacklist } = require("../policies/blacklist.policies");
const { authorize } = require("../middleware/abac");
const {
    insertIntoBlacklist,
} = require("../controller/blacklist/create.controller");
const { getBlacklist } = require("../controller/blacklist/get.controller");
const { removeFromBlacklist } = require("../controller/blacklist/delete.controller");
const validate = require("../middleware/validate");
const { blacklistCreateSchema, blacklistDeleteSchema } = require("../schemas/blacklist/blacklist.schema");
const {
    buildCurpReasonValidationMessage,
} = require("../utils/validationMessages");
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
    validate(blacklistCreateSchema, "body", {
        messageBuilder: buildCurpReasonValidationMessage,
    }),
    authorize(canAddToBlacklist, (req) => req.body),
    insertIntoBlacklist
);

router.patch(
    "/delete",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.REMOVE_FROM_BLACKLIST),
    validate(blacklistDeleteSchema, "body", {
        messageBuilder: buildCurpReasonValidationMessage,
    }),
    authorize(canRemoveFromBlacklist, (req) => req.body),
    removeFromBlacklist
);

module.exports = router;

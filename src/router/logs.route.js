const express = require("express");
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const logsGetController = require("../controller/logs/get.controller");

const router = express.Router();

router.get(
    "/actions",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.VIEW_LOGS),
    logsGetController.getLogsActions,
);

router.get(
    "/house",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.VIEW_LOGS),
    logsGetController.getLogsByHouse,
);

router.get(
    "/house/report/pdf",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.VIEW_LOGS),
    logsGetController.getLogsPdfByHouse,
);

module.exports = router;

const express = require("express");
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const logsGetController = require("../controller/logs/get.controller");

const router = express.Router();

router.get(
    "/house",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole("Coordinador"),
    requirePrivileges("viewLogs"),
    logsGetController.getLogsByHouse,
);

router.get(
    "/house/report/pdf",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole("Coordinador"),
    requirePrivileges("viewLogs"),
    logsGetController.getLogsPdfByHouse,
);

module.exports = router;

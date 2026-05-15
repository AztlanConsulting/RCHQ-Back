const express = require("express");
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole } = require("../middleware/rbac");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const { getAbsenceTypes } = require("../controller/absence/get.controller");

const router = express.Router();

router.get(
    "/types",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole("Coordinador"),
    getAbsenceTypes,
);

module.exports = router;

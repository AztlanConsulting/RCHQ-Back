const express = require("express");
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole } = require("../middleware/rbac");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const { employeePolicy } = require("../policies/employee.policies");
const { authorize } = require("../middleware/abac");
const {
    getHouseEmployees,
    getHouseName,
} = require("../controller/house/get.controller");

const router = express.Router();

router.get(
    "/getHouseName",
    apiLimiter,
    verifyToken,
    getHouseName,
);

router.get(
    "/employees",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole("Coordinador"),
    authorize(employeePolicy, (req) => ({ houseId: req.resolvedRequester.houseId })),
    getHouseEmployees,
);

module.exports = router;

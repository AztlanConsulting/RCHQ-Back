const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole, requirePrivileges, allRoles } = require("../middleware/rbac");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const { employeePolicy } = require("../policies/employee.policies");
const {
    authorize,
    isAllowed,
} = require("../middleware/abac");

const {
    getAllEventTypes,
    getEventsInRange,
    getHouseCalendarRecordsInRange,
} = require("../controller/event/get.controller")

router.get(
    "/range/:id/:startDate/:endDate", 
    apiLimiter, 
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges("viewEvents"),
    isAllowed,
    getEventsInRange
);

router.get(
    "/house/range/:startDate/:endDate",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole("Admin", "Coordinador"),
    requirePrivileges("viewEvents"),
    authorize(employeePolicy, (req) => ({ houseId: req.resolvedRequester.houseId })),
    getHouseCalendarRecordsInRange,
);

router.get("/getAllTypes", apiLimiter, verifyToken, getAllEventTypes);

module.exports = router;

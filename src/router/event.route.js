const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const {
    requireRole,
    requirePrivileges,
    allRoles,
} = require("../middleware/rbac");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const { employeePolicy } = require("../policies/employee.policies");
const { authorize, isAllowed } = require("../middleware/abac");

const {
    getAllEventTypes,
    getEventsInRange,
    getHouseCalendarRecordsInRange,
    getEmployeesForSelector,
} = require("../controller/event/get.controller");

const {
    createHouseEvent,
    createPersonalEvent,
} = require("../controller/event/create.controller");
const { houseEventPolicy } = require("../policies/event.policies");
const { ROLES } = require("../utils/roles");

router.get(
    "/range/:id/:startDate/:endDate",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges("viewEvents"),
    isAllowed,
    getEventsInRange,
);

router.get(
    "/house/range/:startDate/:endDate",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole("Admin", "Coordinador"),
    requirePrivileges("viewEvents"),
    authorize(employeePolicy, (req) => ({
        houseId: req.resolvedRequester.houseId,
    })),
    getHouseCalendarRecordsInRange,
);

router.get(
    "/getAllTypes",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges("viewEvents"),
    getAllEventTypes,
);

router.post(
    "/house/add",
    apiLimiter,
    verifyToken,
    requireRole("Admin", "Coordinador"),
    requirePrivileges("createEvent"),
    authorize(houseEventPolicy, (req) => ({ houseId: req.user.houseId })),
    createHouseEvent,
);

router.get(
    "/personal/employees",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges("viewEmployees"),
    getEmployeesForSelector,
);

router.post(
    "/personal/add",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges("createEvent"),
    createPersonalEvent,
);

module.exports = router;

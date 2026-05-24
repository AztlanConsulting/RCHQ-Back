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
const {
    updateHouseEvent,
    updatePersonalEvent,
} = require("../controller/event/update.controller");
const {
    deleteHouseEvent,
    deletePersonalEvent,
} = require("../controller/event/delete.controller");
const {
    houseEventPolicy,
    personalEventPolicy,
    updateHouseEventPolicy,
    updatePersonalEventPolicy,
    deleteHouseEventPolicy,
    deletePersonalEventPolicy,
} = require("../policies/event.policies");
const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");

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
    requireRole("Administrador", "Coordinador"),
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
    requirePrivileges(PRIVILEGES.VIEW_EVENTS),
    getAllEventTypes,
);

router.post(
    "/house/add",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.CREATE_EVENT),
    authorize(houseEventPolicy, (req) => ({ houseId: req.user.houseId })),
    createHouseEvent,
);

router.put(
    "/house/:eventId",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.EDIT_EVENT),
    authorize(updateHouseEventPolicy, (req) => ({ houseId: req.user.houseId })),
    updateHouseEvent,
);

router.get(
    "/personal/employees",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.VIEW_EMPLOYEES),
    getEmployeesForSelector,
);

router.post(
    "/personal/add",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges(PRIVILEGES.CREATE_EVENT),
    authorize(personalEventPolicy, (req) => ({
        houseId: req.user.houseId,
        forceOverlap: req.body?.forceOverlap,
    })),
    createPersonalEvent,
);

router.put(
    "/personal/:eventId",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.EDIT_EVENT),
    authorize(updatePersonalEventPolicy, (req) => ({
        houseId: req.user.houseId,
        forceOverlap: req.body?.forceOverlap,
    })),
    updatePersonalEvent,
);

router.delete(
    "/house/:eventId",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.DELETE_EVENT),
    authorize(deleteHouseEventPolicy, (req) => ({ houseId: req.user.houseId })),
    deleteHouseEvent,
);

router.delete(
    "/personal/:eventId",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.DELETE_EVENT),
    authorize(deletePersonalEventPolicy, (req) => ({
        houseId: req.user.houseId,
    })),
    deletePersonalEvent,
);

module.exports = router;

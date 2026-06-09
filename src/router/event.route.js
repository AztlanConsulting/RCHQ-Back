const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const {
    requireRole,
    requirePrivileges,
} = require("../middleware/rbac");
const {
    resolveEmployeeHouse,
    resolveRequesterHouse,
} = require("../middleware/resolvers");
const {
    employeePolicy,
    viewTrainings,
} = require("../policies/employee.policies");
const { authorize, isAllowed } = require("../middleware/abac");

const {
    getAllEventTypes,
    getEventsInRange,
    getTrainingsByEmployee,
    getHouseCalendarRecordsInRange,
    getEmployeesForSelector,
    getEmployeeDateRules,
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
    removeEmployeeFromPersonalEvent,
} = require("../controller/event/delete.controller");
const {
    houseEventPolicy,
    personalEventPolicy,
    updateHouseEventPolicy,
    updatePersonalEventPolicy,
    deleteHouseEventPolicy,
    deletePersonalEventPolicy,
} = require("../policies/event.policies");
const { ROLES, allRoles } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");

router.get(
    "/range/:id/:startDate/:endDate",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges(PRIVILEGES.VIEW_EVENTS),
    isAllowed,
    getEventsInRange,
);

router.get(
    "/trainings/:employeeId",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges(PRIVILEGES.VIEW_EVENTS),
    resolveEmployeeHouse,
    authorize(viewTrainings, (req) => ({
        employeeId: req.params.employeeId,
        houseId: req.resolvedEmployee.houseId,
    })),
    getTrainingsByEmployee,
);

router.get(
    "/employee/:employeeId/date-rules",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    isAllowed,
    getEmployeeDateRules,
);

router.get(
    "/house/range/:startDate/:endDate",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.VIEW_EVENTS),
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

router.delete(
    "/personal/:eventId/employee/:employeeId",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.DELETE_EVENT),
    authorize(deletePersonalEventPolicy, (req) => ({
        houseId: req.user.houseId,
    })),
    removeEmployeeFromPersonalEvent,
);

module.exports = router;

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
    resolveRequesterHouse,
    resolveVacationRequestResource,
} = require("../middleware/resolvers");
const { ROLES, allRoles } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { apiLimiter } = require("../utils/rateLimit");
const {
    isAllowed,
    canRegisterEmployeeVacation,
    authorize,
} = require("../middleware/abac");
const {
    modifyVacationRequestDates,
    deleteVacationRequestPolicy,
} = require("../policies/vacation.policies");

const { getRemainingVacations,
    getPendingVacationRequests,
    getReviewedVacationRequests,
    getFutureVacationRequests,
    getPastVacationRequests,
    getEligibleVacationEmployees
} = require("../controller/vacation/get.controller");

const {
    requestVacation,
    registerEmployeeVacation,
} = require("../controller/vacation/create.controller");
const {
    approveVacationRequest,
    rejectVacationRequest,
    updateVacationRequestDates,
} = require("../controller/vacation/update.controller");
const {
    deleteVacationRequest,
} = require("../controller/vacation/delete.controller");
const {
    employeeVacationCreateSchema,
} = require("../schemas/vacation/create.schemas");
const {
    approveVacationRequestSchema,
    rejectVacationRequestSchema,
    updateVacationRequestDatesSchema,
} = require("../schemas/vacation/update.schemas");
const {
    deleteVacationRequestSchema,
} = require("../schemas/vacation/delete.schemas");
const {
    getPendingVacationRequestsSchema,
    getReviewedVacationRequestsSchema,
    getOwnVacationRequestsSchema,
} = require("../schemas/vacation/get.schemas");

router.get("/remaining/:id", apiLimiter, verifyToken, isAllowed, getRemainingVacations);

router.post("/request", apiLimiter, verifyToken, resolveRequesterHouse, requestVacation);

router.get(
    "/employees/eligible",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
    getEligibleVacationEmployees,
);

router.post(
    "/employees/:employeeId/register",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
    validate(employeeVacationCreateSchema, "all"),
    canRegisterEmployeeVacation,
    registerEmployeeVacation,
);

router.patch(
    "/request/:vacationRequestId/approve",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
    validate(approveVacationRequestSchema, "all"),
    approveVacationRequest,
);

router.patch(
    "/request/:vacationRequestId/reject",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
    validate(rejectVacationRequestSchema, "all"),
    rejectVacationRequest,
);

router.patch(
    "/request/:vacationRequestId/dates",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    resolveRequesterHouse,
    requirePrivileges(PRIVILEGES.EDIT_VACATIONS),
    validate(updateVacationRequestDatesSchema, "all"),
    resolveVacationRequestResource,
    authorize(modifyVacationRequestDates, (req) => req.resolvedVacationRequest),
    updateVacationRequestDates,
);

router.delete(
    "/request/:vacationRequestId",
    apiLimiter,
    verifyToken,
    validate(deleteVacationRequestSchema, "all"),
    resolveRequesterHouse,
    resolveVacationRequestResource,
    authorize(deleteVacationRequestPolicy, (req) => req.resolvedVacationRequest),
    deleteVacationRequest,
);

router.get(
    "/requests/pending",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
    validate(getPendingVacationRequestsSchema, "all"),
    getPendingVacationRequests
);

router.get(
    "/requests/reviewed",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
    validate(getReviewedVacationRequestsSchema, "all"),
    getReviewedVacationRequests
);

router.get(
    "/requests/future",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges(PRIVILEGES.VIEW_OWN_VACATIONS),
    validate(getOwnVacationRequestsSchema, "all"),
    getFutureVacationRequests
);

router.get(
    "/requests/past",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges(PRIVILEGES.VIEW_OWN_VACATIONS),
    validate(getOwnVacationRequestsSchema, "all"),
    getPastVacationRequests
);

module.exports = router;

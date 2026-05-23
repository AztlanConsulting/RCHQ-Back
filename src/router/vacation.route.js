const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const validate = require("../middleware/validate");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { apiLimiter } = require("../utils/rateLimit");
const {
    isAllowed,
    canRegisterEmployeeVacation,
    canDeleteVacationRequest,
} = require("../middleware/abac");

const { getRemainingVacations,
    getPendingVacationRequests,
    getReviewedVacationRequests,
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
    resolveRequesterHouse,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
    validate(updateVacationRequestDatesSchema, "all"),
    updateVacationRequestDates,
);

router.delete(
    "/request/:vacationRequestId",
    apiLimiter,
    verifyToken,
    validate(deleteVacationRequestSchema, "all"),
    canDeleteVacationRequest,
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

module.exports = router;

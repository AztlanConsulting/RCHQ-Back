const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const validate = require("../middleware/validate");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { apiLimiter } = require("../utils/rateLimit");
const {
    isAllowed,
    canRegisterEmployeeVacation,
} = require("../middleware/abac");

const { getRemainingVacations } = require("../controller/vacation/get.controller");

const {
    requestVacation,
    registerEmployeeVacation,
} = require("../controller/vacation/create.controller");
const {
    approveVacationRequest,
    rejectVacationRequest,
} = require("../controller/vacation/update.controller");

const {
    employeeVacationCreateSchema,
} = require("../schemas/vacation/create.schemas");
const {
    approveVacationRequestSchema,
    rejectVacationRequestSchema,
} = require("../schemas/vacation/update.schemas");

router.get("/remaining/:id", apiLimiter, verifyToken, isAllowed, getRemainingVacations);

router.post("/request", apiLimiter, verifyToken, requestVacation);

router.post(
    "/employees/:employeeId/register",
    apiLimiter,
    verifyToken,
    requireRole("Admin", "Coordinador"),
    requirePrivileges("manageEmployees"),
    validate(employeeVacationCreateSchema, "all"),
    canRegisterEmployeeVacation,
    registerEmployeeVacation,
);

router.patch(
    "/request/:vacationRequestId/approve",
    apiLimiter,
    verifyToken,
    requireRole("Coordinador"),
    requirePrivileges("manageEmployees"),
    validate(approveVacationRequestSchema, "all"),
    approveVacationRequest,
);

router.patch(
    "/request/:vacationRequestId/reject",
    apiLimiter,
    verifyToken,
    requireRole("Coordinador"),
    requirePrivileges("manageEmployees"),
    validate(rejectVacationRequestSchema, "all"),
    rejectVacationRequest,
);

module.exports = router;
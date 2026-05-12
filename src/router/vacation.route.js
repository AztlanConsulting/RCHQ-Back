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
} = require("../controller/vacation/update.controller");

const {
    employeeVacationCreateSchema,
} = require("../schemas/vacation/create.schemas");
const {
    approveVacationRequestSchema,
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
    "/requests/:vacationRequestId/approve",
    apiLimiter,
    verifyToken,
    requireRole("Admin", "Coordinador"),
    requirePrivileges("manageEmployees"),
    validate(approveVacationRequestSchema, "all"),
    approveVacationRequest,
);

module.exports = router;
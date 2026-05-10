const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const validate = require("../middleware/validate");
const { requireRole } = require("../middleware/rbac");
const { apiLimiter } = require("../utils/rateLimit");
const {
    isAllowed
} = require("../middleware/abac");

const { getRemainingVacations } = require("../controller/vacation/get.controller");

const {
    requestVacation,
    registerEmployeeVacation,
} = require("../controller/vacation/create.controller");

const {
    employeeVacationCreateSchema,
} = require("../schemas/vacation/create.schemas");

router.get("/remaining/:id", apiLimiter, verifyToken, isAllowed, getRemainingVacations);

router.post("/request", apiLimiter, verifyToken, requestVacation);

router.post(
    "/employees/:employeeId/register",
    apiLimiter,
    verifyToken,
    requireRole("Admin", "Coordinador"),
    validate(employeeVacationCreateSchema, "all"),
    registerEmployeeVacation
);

module.exports = router;
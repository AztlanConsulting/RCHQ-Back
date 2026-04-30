const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
    isAllowed
} = require("../middleware/abac");

const {
    getRemainingVacations,
    requestVacation,
    registerEmployeeVacation,
} = require("../controller/vacation/add.controller");

const {
    employeeVacationCreateSchema,
} = require("../schemas/vacation/create.schemas");

router.get("/remaining/:id", verifyToken, isAllowed, getRemainingVacations);

router.post("/request", verifyToken, requestVacation);

router.post(
    "/employees/:employeeId/register",
    verifyToken,
    validate(employeeVacationCreateSchema, "all"),
    registerEmployeeVacation
);

module.exports = router;
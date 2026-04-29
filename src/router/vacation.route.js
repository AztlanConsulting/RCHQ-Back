const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const {
    isAllowed
} = require("../middleware/abac");

const {
    getRemainingVacations,
    requestVacation,
    registerEmployeeVacation,
} = require("../controller/vacation/add.controller");

router.get("/remaining/:id", verifyToken, isAllowed, getRemainingVacations);

router.post("/request", verifyToken, requestVacation);

router.post(
    "/employees/:employeeId/register",
    verifyToken,
    registerEmployeeVacation
);

module.exports = router;
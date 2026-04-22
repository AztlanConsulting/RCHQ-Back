const express = require("express");
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const employeeController = require("../controller/employee.controller");

const router = express.Router();

router.get(
    "/employee-detail/:employeeId",
    verifyToken,
    requireRole("admin"),
    // authorize(),
    employeeController.getEmployeeDetail,
);

module.exports = router;

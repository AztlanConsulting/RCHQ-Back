const express = require("express");
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const employeeController = require("../controller/user.controller");

const router = express.Router();

router.get(
    "/employee-detail",
    verifyToken,
    requireRole("admin"),
    // authorize(),
    employeeController.getEmployee,
);

module.exports = router;

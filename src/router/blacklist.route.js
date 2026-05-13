const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { canAddToBlacklist } = require("../middleware/abac");
const { insertIntoBlacklist } = require("../controller/blacklist/create.controller");

router.post(
    "/:employeeId",
    verifyToken,
    requireRole("Coordinador"),
    canAddToBlacklist,
    insertIntoBlacklist
);

module.exports = router;
const express = require("express");
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { apiLimiter } = require("../utils/rateLimit");
const router = express.Router();

const getControllerAbsences = require("../controller/absence/get.controller");

router.get("/absences", 
    apiLimiter, 
    verifyToken, 
    requireRole("Admin", "Coordinador"), 
    requirePrivileges("viewEmployeesAbsences"),
    getControllerAbsences.getAllAbsences);





module.exports = router;
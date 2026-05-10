const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { apiLimiter } = require("../utils/rateLimit");

const getController = require("../controller/house/get.controller");

router.get("/all", 
    apiLimiter, 
    verifyToken, 
    requireRole("Admin", "Coordinador"), 
    requirePrivileges("viewEmployeesHouses"),
    getController.getAllHouses);

module.exports = router;
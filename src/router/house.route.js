const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { apiLimiter } = require("../utils/rateLimit");

const getController = require("../controller/house/get.controller");

router.get("/all", 
    apiLimiter, 
    verifyToken, 
    requireRole("Admin", "Coordinador"), 
    getController.getAllHouses);

module.exports = router;
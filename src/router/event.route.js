const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole, requirePrivileges, allRoles } = require("../middleware/rbac");
const {
    isAllowed
} = require("../middleware/abac");

const {
    getAllEventTypes, getEventsInRange
} = require("../controller/event/get.controller")

router.get(
    "/range/:id/:startDate/:endDate", 
    apiLimiter, 
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges("viewEvents"),
    isAllowed,
    getEventsInRange
);

router.get("/getAllTypes", apiLimiter, verifyToken, getAllEventTypes);

module.exports = router;
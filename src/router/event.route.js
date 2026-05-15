const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const {
    requireRole,
    requirePrivileges,
    allRoles,
} = require("../middleware/rbac");
const {
    authorize,
    isAllowed,
} = require("../middleware/abac");

const {
    getAllEventTypes,
    getEventsInRange,
} = require("../controller/event/get.controller");

const { createHouseEvent } = require("../controller/event/create.controler");
const { houseEventPolicy } = require("../policies/event.policies");

router.get(
    "/range/:id/:startDate/:endDate",
    apiLimiter,
    verifyToken,
    requireRole(...allRoles),
    requirePrivileges("viewEvents"),
    isAllowed,
    getEventsInRange,
);

router.get("/getAllTypes", apiLimiter, verifyToken, getAllEventTypes);

router.post(
    "/house/add",
    apiLimiter,
    verifyToken,
    requireRole("Admin", "Coordinador"),
    requirePrivileges("createEvent"),
    authorize(houseEventPolicy, (req) => ({ houseId: req.user.houseId })),
    createHouseEvent,
);

module.exports = router;

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const {
    isAllowed
} = require("../middleware/abac");

const {
    getEventsInRange
} = require("../controller/event/get.controller")

router.get("/range/:id/:startDate/:endDate", apiLimiter, verifyToken, isAllowed, getEventsInRange);

module.exports = router;
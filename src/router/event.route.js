const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const {
    isAllowed
} = require("../middleware/abac");

const {
    getEventsInRange
} = require("../controller/event/get.controller")

router.get("/range/:id/:startDate/:endDate", verifyToken, isAllowed, getEventsInRange);

module.exports = router;
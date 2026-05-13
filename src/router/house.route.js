const express = require("express");
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const { getHouseName } = require("../controller/house/get.controller");

const router = express.Router();

router.get(
    "/getHouseName",
    apiLimiter,
    verifyToken,
    getHouseName,
);

module.exports = router;

const express = require("express");
const verifyToken = require("../middleware/auth");
const profileController = require("../controller/user/profile.controller");
const { apiLimiter } = require("../utils/rateLimit");

const router = express.Router();

router.get(
    "/profile",
    apiLimiter,
    verifyToken,
    profileController.getUserProfile,
);

module.exports = router;

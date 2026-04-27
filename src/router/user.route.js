const express = require("express");
const verifyToken = require("../middleware/auth");
const profileController = require("../controller/user/profile.controller");

const router = express.Router();

router.get("/profile", verifyToken, profileController.getUserProfile);

module.exports = router;

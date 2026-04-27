const express = require("express");
const verifyToken = require("../middleware/auth");
const authController = require("../controller/auth/auth.controller");

const router = express.Router();

router.get(
    "/profile",
    verifyToken,
    authController.getProfile
);

module.exports = router;
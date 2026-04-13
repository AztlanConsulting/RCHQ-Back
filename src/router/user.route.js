const express = require("express");
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const userController = require("../controller/user.controller");
const userModel = require("../model/user.model");
const { authorize } = require("../middleware/abac");
const { adminPolicy } = require("../policies/user.policies");
const verifyFirstLoginToken = require("../middleware/firstLoginAuth");
const verifyPre2faToken = require("../middleware/pre2faAuth");

const router = express.Router();

router.post("/login", userController.loginFunction);
router.post("/first-login/change-password", verifyFirstLoginToken, userController.changePasswordFirstLogin);

router.post("/2fa/setup", verifyToken, userController.setupTwoFactorAuth);
router.post("/2fa/verify-setup", verifyToken, userController.verifyTwoFactorSetup);
router.post("/2fa/validate", verifyPre2faToken, userController.validateTwoFactorAuth);

// Protected route example with ABAC and RBAC
router.get(
  "/profile",
  verifyToken,
  requireRole("admin", "user"),
  authorize(adminPolicy, { coordinators: userModel.coordinators || [] }),
  userController.getProfile,
);

module.exports = router;

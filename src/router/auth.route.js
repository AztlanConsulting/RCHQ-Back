const express = require("express");
const verifyToken = require("../middleware/auth");
const userController = require("../controller/auth.controller");
const verifyFirstLoginToken = require("../middleware/firstLoginAuth");
const verifyPreTwoFactorAuthToken = require("../middleware/pre2faAuth");
const validate = require("../middleware/validate");
const {
  loginSchema,
  firstLoginChangePasswordSchema,
  changePasswordSchema,
  twoFactorTokenSchema,
  disableTwoFactorSchema,
} = require("../schemas/auth.schemas");

const router = express.Router();

router.post("/login", validate(loginSchema), userController.loginFunction);

router.post(
  "/first-login/change-password",
  verifyFirstLoginToken,
  validate(firstLoginChangePasswordSchema),
  userController.changePasswordFirstLogin,
);

router.post(
  "/change-password",
  verifyToken,
  validate(changePasswordSchema),
  userController.changePassword,
);

router.post("/2fa/setup", verifyToken, userController.setupTwoFactorAuth);

router.post(
  "/2fa/verify",
  verifyToken,
  validate(twoFactorTokenSchema),
  userController.verifyTwoFactorSetup,
);

router.post(
  "/2fa/validate",
  verifyPreTwoFactorAuthToken,
  validate(twoFactorTokenSchema),
  userController.validateTwoFactorAuth,
);

router.post(
  "/2fa/disable",
  verifyToken,
  validate(disableTwoFactorSchema),
  userController.disableTwoFactorAuth,
);

router.get("/status/2FA", verifyToken, userController.getTwoFactorAuthStatus);


module.exports = router;

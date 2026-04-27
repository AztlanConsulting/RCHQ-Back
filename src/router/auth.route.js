// src/router/auth.route.js
const express = require("express");
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const authController = require("../controller/auth/auth.controller");
const { authorize } = require("../middleware/abac");
const verifyFirstLoginToken = require("../middleware/firstLoginAuth");
const verifyPre2faToken = require("../middleware/pre2faAuth");
const validate = require("../middleware/validate");
const {
    loginSchema,
    firstLoginChangePasswordSchema,
    changePasswordSchema,
    twoFactorTokenSchema,
    disableTwoFactorSchema,
} = require("../schemas/auth.schemas");

const router = express.Router();

router.post("/login", validate(loginSchema), authController.loginFunction);

router.post(
    "/first-login/change-password",
    verifyFirstLoginToken,
    validate(firstLoginChangePasswordSchema),
    authController.changePasswordFirstLogin,
);

router.post(
    "/change-password",
    verifyToken,
    validate(changePasswordSchema),
    authController.changePassword,
);

router.post("/2fa/setup", verifyToken, authController.setupTwoFactorAuth);

router.post(
    "/2fa/verify",
    verifyToken,
    validate(twoFactorTokenSchema),
    authController.verifyTwoFactorSetup,
);

router.post(
    "/2fa/validate",
    verifyPre2faToken,
    validate(twoFactorTokenSchema),
    authController.validateTwoFactorAuth,
);

router.post(
    "/2fa/disable",
    verifyToken,
    validate(disableTwoFactorSchema),
    authController.disableTwoFactorAuth,
);

router.get("/status/2FA", verifyToken, authController.getStatus2FA);

module.exports = router;

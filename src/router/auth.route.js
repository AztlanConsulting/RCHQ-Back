const express = require("express");
const verifyToken = require("../middleware/auth");
const authController = require("../controller/auth/auth.controller");
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
const { authLimiter } = require("../utils/rateLimit");
const { apiLimiter } = require("../utils/rateLimit");

const router = express.Router();

router.post(
    "/login",
    //authLimiter,
    validate(loginSchema),
    authController.loginFunction,
);

router.post(
    "/first-login/change-password",
    //apiLimiter,
    verifyFirstLoginToken,
    validate(firstLoginChangePasswordSchema),
    authController.changePasswordFirstLogin,
);

router.post(
    "/change-password",
    //apiLimiter,
    verifyToken,
    validate(changePasswordSchema),
    authController.changePassword,
);

router.post(
    "/2fa/setup",
    //apiLimiter,
    verifyToken,
    authController.setupTwoFactorAuth,
);

router.post(
    "/2fa/verify",
    //apiLimiter,
    verifyToken,
    validate(twoFactorTokenSchema),
    authController.verifyTwoFactorSetup,
);

router.post(
    "/2fa/validate",
    //authLimiter,
    verifyPreTwoFactorAuthToken,
    validate(twoFactorTokenSchema),
    authController.validateTwoFactorAuth,
);

router.post(
    "/2fa/disable",
    //apiLimiter,
    verifyToken,
    validate(disableTwoFactorSchema),
    authController.disableTwoFactorAuth,
);

router.get(
    "/2fa/status",
    //apiLimiter,
    verifyToken,
    authController.getTwoFactorAuthStatus,
);

module.exports = router;

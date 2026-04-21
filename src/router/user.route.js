const express = require("express");
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const userController = require("../controller/user.controller");
const userModel = require("../model/user.model");
const { authorize } = require("../middleware/abac");
const { adminPolicy } = require("../policies/employeeAdd.policies");
// const verifyFirstLoginToken = require("../middleware/firstLoginAuth");
const verifyPre2faToken = require("../middleware/pre2faAuth");
const validate = require("../middleware/validate");
const {
    loginSchema,
    //firstLoginChangePasswordSchema,
    twoFactorTokenSchema,
    disableTwoFactorSchema,
} = require("../schemas/auth.schemas");

const router = express.Router();

router.post("/login", validate(loginSchema), userController.loginFunction);
//router.post("/first-login/change-password", verifyFirstLoginToken, userController.changePasswordFirstLogin);

// router.post(
//   "/first-login/change-password",
//   verifyFirstLoginToken,
//   validate(firstLoginChangePasswordSchema),
//   userController.changePasswordFirstLogin
// );

router.post("/2fa/setup", verifyToken, userController.setupTwoFactorAuth);

router.post(
    "/2fa/verify",
    verifyToken,
    validate(twoFactorTokenSchema),
    userController.verifyTwoFactorSetup,
);

router.post(
    "/2fa/validate",
    verifyPre2faToken,
    validate(twoFactorTokenSchema),
    userController.validateTwoFactorAuth,
);

router.post(
    "/2fa/disable",
    verifyToken,
    validate(disableTwoFactorSchema),
    userController.disableTwoFactorAuth,
);

router.get("/status/2FA", verifyToken, userController.getStatus2FA);
// Protected route example with ABAC and RBAC
router.get(
    "/profile",
    verifyToken,
    // requireRole("admin", "user"),
    // authorize(adminPolicy, { coordinators: userModel.coordinators || [] }),
    userController.getProfile,
);

module.exports = router;

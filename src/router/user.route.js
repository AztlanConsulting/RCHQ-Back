const express = require('express');
const verifyToken = require('../middleware/auth');
const {requireRole}  = require('../middleware/rbac');
const userController = require('../controller/user.controller');
const userModel = require('../model/user.model');
const { authorize } = require('../middleware/abac');
const { adminPolicy } = require('../policies/user.policies');

const router = express.Router();


router.post('/login' ,userController.loginFunction);

router.post('/2fa', userController.twoFactorAuth);

router.post('/verify-2fa', userController.verifyTwoFactorAuth);

router.post('validate-2fa', userController.validateTwoFactorAuth);


// Protected route example with ABAC and RBAC
router.get('/profile', verifyToken,requireRole("admin","user"),authorize(adminPolicy, 
    {coordinators: userModel.coordinators || []}),userController.getProfile);

module.exports = router;

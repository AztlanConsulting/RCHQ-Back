const express = require('express');
const verifyToken = require('../middleware/auth');
const {requireRole}  = require('../middleware/rbac');
const userController = require('../controller/user.controller');

const router = express.Router();


router.post('/login' ,userController.loginFunction);

router.post('/2fa', userController.twoFactorAuth);

router.post('/verify-2fa', userController.verifyTwoFactorAuth);

router.get('/profile', verifyToken,requireRole("admin","user"),userController.getProfile);

module.exports = router;

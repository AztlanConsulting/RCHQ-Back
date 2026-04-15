const User = require("../model/user.model");
const { hashPassword, verifyPassword } = require("../utils/password");
const { getClientIp } = require("../utils/ip");
const authLogger = require("../utils/auth/authLogger");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { LOG_ACTIONS } = require("../utils/logActions");
const {
    buildSessionToken,
    buildFirstLoginJwt,
    buildPre2faJwt,
} = require("../utils/auth/authTokens");
const {
    isBlockedUntil,
    clearExpiredLoginBlock,
    clearExpired2FABlock,
} = require("../utils/auth/authGuards");

const TEMP_2FA_SETUP_EXPIRATION_MINUTES = 10;

async function login(req) {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const ipAddress = getClientIp(req);

    const employee = await User.findEmployeeByEmail(normalizedEmail);

    if (!employee) {
        return {
            status: 401,
            body: { success: false, message: "Invalid credentials" },
        };
    }

    if (!employee.isactive) {
        await authLogger.logInactiveAccess(employee.employeeid, ipAddress);
        return {
            status: 401,
            body: { success: false, message: "Invalid credentials" },
        };
    }

    if (isBlockedUntil(employee.blockeduntil)) {
        return {
            status: 423,
            body: {
                success: false,
                message: "Account temporarily blocked",
                nextStep: "WAIT_BLOCK",
                blockedUntil: employee.blockeduntil,
            },
        };
    }

    await clearExpiredLoginBlock(employee);

    const passwordMatches = await verifyPassword(password, employee.pwd);

    if (!passwordMatches) {
        const attempts = await User.incrementFailedAttempts(employee.employeeid);
        await authLogger.logLoginFailed(employee.employeeid, ipAddress);

        if (attempts >= 3) {
            const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            await User.setBlockedUntil(employee.employeeid, blockedUntil);
            await authLogger.logAccountBlocked(employee.employeeid, ipAddress);

            return {
                status: 423,
                body: {
                    success: false,
                    message: "Account temporarily blocked",
                    nextStep: "WAIT_BLOCK",
                    blockedUntil,
                },
            };
        }

        return {
            status: 401,
            body: { success: false, message: "Invalid credentials" },
        };
    }

    await User.clearLoginSecurityState(employee.employeeid);

    if (employee.hasfirstlogin) {
        const firstLoginToken = buildFirstLoginJwt(employee);
        await authLogger.logFirstLoginPendingPasswordChange(employee.employeeid, ipAddress);

        return {
            status: 200,
            body: {
                success: true,
                message: "First login, password change required",
                nextStep: "CHANGE_PASSWORD",
                firstLoginToken,
                data: {
                    email: employee.email,
                    name: employee.name,
                    role: employee.role,
                },
            },
        };
    }

    if (employee.totpsecret) {
        if (isBlockedUntil(employee.twofablockeduntil)) {
            return {
                status: 423,
                body: {
                    success: false,
                    message: "2FA temporarily blocked",
                    nextStep: "WAIT_2FA_BLOCK",
                    blockedUntil: employee.twofablockeduntil,
                },
            };
        }

        await clearExpired2FABlock(employee);

        const pre2faToken = buildPre2faJwt(employee);

        return {
            status: 200,
            body: {
                success: true,
                message: "2FA required",
                nextStep: "VALIDATE_2FA",
                pre2faToken,
                data: {
                    email: employee.email,
                },
            },
        };
    }

    const token = buildSessionToken(employee);
    await authLogger.logLoginSuccess(employee.employeeid, ipAddress);

    return {
        status: 200,
        body: {
            success: true,
            message: "Login successful",
            nextStep: "LOGIN_COMPLETE",
            token,
            remind2FA: true,
            data: {
                employeeId: employee.employeeid,
                email: employee.email,
                name: employee.name,
                role: employee.role,
            },
        },
    };
}

async function changePasswordFirstLogin(req) {
    const { newPassword, confirmPassword } = req.body;
    const employeeId = req.user?.id;
    const ipAddress = getClientIp(req);

    if (!employeeId) {
        return {
            status: 401,
            body: { success: false, message: "User not authenticated" },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Employee not found" },
        };
    }

    if (!employee.isactive) {
        await User.createLog(
            employee.employeeid,
            LOG_ACTIONS.FIRST_LOGIN_CHANGE_PASSWORD_INACTIVE,
            ipAddress
        );

        return {
            status: 403,
            body: { success: false, message: "Access not allowed" },
        };
    }

    if (!employee.hasfirstlogin) {
        return {
            status: 409,
            body: { success: false, message: "First login password change is no longer required" },
        };
    }

    const isSamePassword = await verifyPassword(newPassword, employee.pwd);

    if (isSamePassword) {
        return {
            status: 400,
            body: { success: false, message: "New password must be different from current password" },
        };
    }

    const hashedPassword = await hashPassword(newPassword);

    await User.completeFirstLoginPasswordChange(
        employee.employeeid,
        hashedPassword,
        ipAddress,
    );

    const token = buildSessionToken(employee);

    return {
        status: 200,
        body: {
            success: true,
            message: "Password changed successfully",
            nextStep: "SETUP_2FA_OPTIONAL",
            token,
            data: {
                employeeId: employee.employeeid,
                email: employee.email,
                name: employee.name,
                role: employee.role,
                shouldPrompt2FASetup: true,
            },
        },
    };
}

async function setupTwoFactorAuth(req) {
    const employeeId = req.user?.id;
    const ipAddress = getClientIp(req);

    if (!employeeId) {
        return {
            status: 401,
            body: { success: false, message: "User not authenticated" },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Employee not found" },
        };
    }

    if (!employee.isactive) {
        await User.createLog(
            employee.employeeid,
            LOG_ACTIONS.TWO_FA_SETUP_INACTIVE,
            ipAddress
        );

        return {
            status: 403,
            body: { success: false, message: "Access not allowed" },
        };
    }

    if (employee.totpsecret) {
        return {
            status: 409,
            body: { success: false, message: "2FA is already enabled for this account" },
        };
    }

    if (employee.temptotpsecret && employee.temptotpsecretcreatedat) {
        const createdAt = new Date(employee.temptotpsecretcreatedat);
        const expiresAt = new Date(
            createdAt.getTime() + TEMP_2FA_SETUP_EXPIRATION_MINUTES * 60 * 1000
        );

        if (expiresAt > new Date()) {
            return {
                status: 409,
                body: {
                    success: false,
                    message: "A 2FA setup is already pending. Please complete it or wait for it to expire.",
                },
            };
        }

        await User.clearTempTotpSecret(employee.employeeid);
    }

    const tempSecret = speakeasy.generateSecret({
        name: `RCHQ (${employee.email})`,
        issuer: "RCHQ",
        length: 20,
    });

    await User.saveTempTotpSecret(employee.employeeid, tempSecret.base32);

    const qrImage = await QRCode.toDataURL(tempSecret.otpauth_url);

    return {
        status: 200,
        body: {
            success: true,
            message: "2FA setup started",
            nextStep: "VERIFY_2FA_SETUP",
            data: {
                employeeId: employee.employeeid,
                qrImage,
                otpauth_url: tempSecret.otpauth_url,
            },
        },
    };
}

async function verifyTwoFactorSetup(req) {
    const { token } = req.body || {};
    const employeeId = req.user?.id;
    const ipAddress = getClientIp(req);

    if (!employeeId) {
        return {
            status: 401,
            body: { success: false, message: "User not authenticated" },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Employee not found" },
        };
    }

    if (!employee.isactive) {
        await User.createLog(
            employee.employeeid,
            LOG_ACTIONS.TWO_FA_VERIFY_INACTIVE,
            ipAddress
        );

        return {
            status: 403,
            body: { success: false, message: "Access not allowed" },
        };
    }

    if (!employee.temptotpsecret) {
        return {
            status: 409,
            body: { success: false, message: "No pending 2FA setup found" },
        };
    }

    if (!employee.temptotpsecretcreatedat) {
        await User.clearTempTotpSecret(employee.employeeid);
        return {
            status: 409,
            body: {
                success: false,
                message: "Invalid pending 2FA setup state",
            },
        };
    }

    const createdAt = new Date(employee.temptotpsecretcreatedat);
    const expiresAt = new Date(
        createdAt.getTime() + TEMP_2FA_SETUP_EXPIRATION_MINUTES * 60 * 1000
    );

    if (expiresAt <= new Date()) {
        await User.clearTempTotpSecret(employee.employeeid);

        return {
            status: 409,
            body: {
                success: false,
                message: "Pending 2FA setup has expired. Please start again.",
            },
        };
    }

    const verified = speakeasy.totp.verify({
        secret: employee.temptotpsecret,
        encoding: "base32",
        token,
        window: 1,
    });

    if (!verified) {
        await User.createLog(
            employee.employeeid,
            LOG_ACTIONS.TWO_FA_SETUP_FAILED,
            ipAddress
        );

        return {
            status: 400,
            body: {
                success: false,
                message: "Invalid 2FA code. Setup could not be completed.",
                nextStep: "2FA_SETUP_FAILED",
                data: {
                    employeeId: employee.employeeid,
                    canRetryInSettings: true,
                },
            },
        };
    }

    await User.activateTempTotpSecretWithLog(employee.employeeid, ipAddress);

    return {
        status: 200,
        body: {
            success: true,
            message: "2FA activated successfully",
            nextStep: "2FA_SETUP_COMPLETE",
            data: {
                employeeId: employee.employeeid,
                twoFactorEnabled: true,
            },
        },
    };
}

async function validateTwoFactorAuth(req) {
    const { token } = req.body || {};
    const employeeId = req.user?.id;
    const ipAddress = getClientIp(req);

    if (!employeeId) {
        return {
            status: 401,
            body: { success: false, message: "User not authenticated" },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Employee not found" },
        };
    }

    if (!employee.isactive) {
        await User.createLog(
            employee.employeeid,
            LOG_ACTIONS.TWO_FA_VALIDATE_INACTIVE,
            ipAddress
        );

        return {
            status: 403,
            body: { success: false, message: "Access not allowed" },
        };
    }

    if (!employee.totpsecret) {
        return {
            status: 409,
            body: { success: false, message: "2FA is not enabled for this account" },
        };
    }

    if (isBlockedUntil(employee.twofablockeduntil)) {
        return {
            status: 423,
            body: {
                success: false,
                message: "2FA temporarily blocked",
                nextStep: "WAIT_2FA_BLOCK",
                blockedUntil: employee.twofablockeduntil,
            },
        };
    }

    await clearExpired2FABlock(employee);

    const isValid = speakeasy.totp.verify({
        secret: employee.totpsecret,
        encoding: "base32",
        token,
        window: 1,
    });

    if (!isValid) {
        const attempts = await User.incrementFailed2FAAttempts(employee.employeeid);

        await User.createLog(
            employee.employeeid,
            LOG_ACTIONS.TWO_FA_LOGIN_FAILED,
            ipAddress
        );

        if (attempts >= 3) {
            const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);

            await User.set2FABlockedUntil(employee.employeeid, blockedUntil);

            await User.createLog(
                employee.employeeid,
                LOG_ACTIONS.TWO_FA_BLOCKED,
                ipAddress
            );

            return {
                status: 423,
                body: {
                    success: false,
                    message: "2FA temporarily blocked",
                    nextStep: "WAIT_2FA_BLOCK",
                    blockedUntil,
                },
            };
        }

        return {
            status: 401,
            body: { success: false, message: "Invalid 2FA token" },
        };
    }

    await User.clear2FASecurityState(employee.employeeid);

    const tokenJwt = buildSessionToken(employee);

    await User.createLog(
        employee.employeeid,
        LOG_ACTIONS.TWO_FA_LOGIN_SUCCESS,
        ipAddress
    );

    return {
        status: 200,
        body: {
            success: true,
            message: "2FA validation successful",
            nextStep: "LOGIN_COMPLETE",
            token: tokenJwt,
            data: {
                employeeId: employee.employeeid,
                email: employee.email,
                name: employee.name,
                role: employee.role,
            },
        },
    };
}

async function disableTwoFactorAuth(req) {
    const { password } = req.body || {};
    const employeeId = req.user?.id;
    const ipAddress = getClientIp(req);

    if (!employeeId) {
        return {
            status: 401,
            body: { success: false, message: "User not authenticated" },
        };
    }

    if (!password) {
        return {
            status: 400,
            body: { success: false, message: "Password is required to disable 2FA" },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Employee not found" },
        };
    }

    if (!employee.isactive) {
        await User.createLog(
            employee.employeeid,
            LOG_ACTIONS.TWO_FA_DISABLE_INACTIVE,
            ipAddress
        );

        return {
            status: 403,
            body: { success: false, message: "Access not allowed" },
        };
    }

    if (!employee.totpsecret) {
        return {
            status: 409,
            body: { success: false, message: "2FA is not enabled for this account" },
        };
    }

    const passwordMatches = await verifyPassword(password, employee.pwd);

    if (!passwordMatches) {
        await User.createLog(
            employee.employeeid,
            LOG_ACTIONS.TWO_FA_DISABLE_WRONG_PASSWORD,
            ipAddress
        );

        return {
            status: 401,
            body: { success: false, message: "Invalid credentials" },
        };
    }

    await User.disableTotpSecretWithLog(employee.employeeid, ipAddress);

    return {
        status: 200,
        body: {
            success: true,
            message: "2FA disabled successfully",
            nextStep: "2FA_DISABLED",
            data: {
                employeeId: employee.employeeid,
                twoFactorEnabled: false,
            },
        },
    };
}

module.exports = {
    login,
    changePasswordFirstLogin,
    setupTwoFactorAuth,
    verifyTwoFactorSetup,
    validateTwoFactorAuth,
    disableTwoFactorAuth,
};
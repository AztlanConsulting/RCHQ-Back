const User = require("../model/user.model");
const { verifyPassword } = require("../utils/password");
const { getClientIp } = require("../utils/ip");
const authLogger = require("../utils/auth/authLogger");
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

async function login(req) {
    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const ipAddress = getClientIp(req);

    if (!normalizedEmail || !password) {
        return {
            status: 400,
            body: { success: false, message: "Email and password required" },
        };
    }

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

module.exports = {
    login,
};
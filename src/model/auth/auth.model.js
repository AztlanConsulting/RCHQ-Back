const prisma = require("../../prisma");
const { createHash } = require("crypto");

function mapEmployee(employee) {
    if (!employee) return undefined;

    return {
        employeeId: employee.employee_id,
        email: employee.email,
        pwd: employee.password,
        name: employee.name,
        role: employee.role?.name,
        roleId: employee.role_id,
        isActive: employee.is_active,
        hasFirstLogin: employee.has_first_login,
        isActiveTwoFactorAuth: employee.is_active_two_factor_auth,
        totpSecret: employee.totp_secret,
        curp: employee.curp,
        birthDate: employee.birth_date,
        picture: employee.picture,
        startDate: employee.start_date,
        nss: employee.nss,
        bankAccount: employee.bank_account,
        houseId: employee.house_id,
        failedLoginAttempts: employee.failed_login_attempts,
        failedTwoFactorAuthAttempts: employee.failed_two_factor_auth_attempts,
        blockedUntil: employee.blocked_until,
        twoFaBlockedUntil: employee.two_fa_blocked_until,
        tempTotpSecret: employee.temp_totp_secret,
        tempTotpSecretCreatedAt: employee.temp_totp_secret_created_at,
        refreshToken: employee.refresh_token,
    };
}

function hashRefreshToken(token) {
    return createHash("sha256").update(token).digest("hex");
}

function mapSession(session) {
    if (!session) return undefined;

    return {
        sessionId: session.session_id,
        employeeId: session.employee_id,
        refreshTokenHash: session.refresh_token_hash,
        isActive: session.is_active,
        lastActivityAt: session.last_activity_at,
        blocksLoginUntil: session.blocks_login_until,
        expiresAt: session.expires_at,
        revokedAt: session.revoked_at,
        createdAt: session.created_at,
        employee: mapEmployee(session.employee),
    };
}

async function findEmployeeByEmail(email) {
    const employee = await prisma.employee.findFirst({
        where: {
            email: {
                equals: email.trim(),
                mode: "insensitive",
            },
        },
        include: {
            role: {
                select: {
                    name: true,
                },
            },
        },
    });
    return mapEmployee(employee);
}

async function getEmployeeById(employeeId) {
    const employee = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        include: {
            role: {
                select: {
                    name: true,
                },
            },
        },
    });
    return mapEmployee(employee);
}

async function updatePassword(employeeId, hashedPassword, db = prisma) {
    await db.employee.update({
        where: { employee_id: employeeId },
        data: {
            password: hashedPassword,
        },
    });
}

async function setFirstLogin(employeeId, hasFirstLogin, db = prisma) {
    await db.employee.update({
        where: { employee_id: employeeId },
        data: {
            has_first_login: hasFirstLogin,
        },
    });
}

async function updatePasswordAndClearFirstLogin(
    employeeId,
    hashedPassword,
    db = prisma,
) {
    await db.employee.update({
        where: { employee_id: employeeId },
        data: {
            password: hashedPassword,
            has_first_login: false,
        },
    });
}

async function activateTwoFactorFromTempSecret(employeeId, db = prisma) {
    const employee = await db.employee.findUnique({
        where: { employee_id: employeeId },
        select: {
            temp_totp_secret: true,
        },
    });

    await db.employee.update({
        where: { employee_id: employeeId },
        data: {
            totp_secret: employee?.temp_totp_secret ?? null,
            temp_totp_secret: null,
            temp_totp_secret_created_at: null,
            is_active_two_factor_auth: true,
        },
    });
}

async function disableTwoFactor(employeeId, db = prisma) {
    await db.employee.update({
        where: { employee_id: employeeId },
        data: {
            totp_secret: null,
            temp_totp_secret: null,
            temp_totp_secret_created_at: null,
            is_active_two_factor_auth: false,
        },
    });
}

async function incrementFailedAttempts(employeeId) {
    const employee = await prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            failed_login_attempts: {
                increment: 1,
            },
        },
        select: {
            failed_login_attempts: true,
        },
    });
    return employee.failed_login_attempts ?? 0;
}

async function resetFailedAttempts(employeeId) {
    await prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            failed_login_attempts: 0,
        },
    });
}

async function setBlockedUntil(employeeId, blockedUntil) {
    return prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            blocked_until: blockedUntil,
        },
        select: {
            employee_id: true,
            blocked_until: true,
        },
    });
}

async function clearBlockedUntil(employeeId) {
    return prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            blocked_until: null,
        },
        select: {
            employee_id: true,
            blocked_until: true,
        },
    });
}

async function clearLoginSecurityState(employeeId) {
    await prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            failed_login_attempts: 0,
            blocked_until: null,
        },
    });
}

async function saveTempTotpSecret(employeeId, secret) {
    await prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            temp_totp_secret: secret,
            temp_totp_secret_created_at: new Date(),
        },
    });
}

async function clearTempTotpSecret(employeeId) {
    await prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            temp_totp_secret: null,
            temp_totp_secret_created_at: null,
        },
    });
}

async function incrementFailedTwoFactorAuthAttempts(employeeId) {
    const employee = await prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            failed_two_factor_auth_attempts: {
                increment: 1,
            },
        },
        select: {
            failed_two_factor_auth_attempts: true,
        },
    });

    return employee.failed_two_factor_auth_attempts ?? 0;
}

async function setTwoFactorAuthBlockedUntil(employeeId, blockedUntil) {
    return prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            two_fa_blocked_until: blockedUntil,
        },
        select: {
            employee_id: true,
            two_fa_blocked_until: true,
        },
    });
}

async function clearTwoFactorAuthSecurityState(employeeId) {
    await prisma.employee.update({
        where: { employee_id: employeeId },
        data: {
            failed_two_factor_auth_attempts: 0,
            two_fa_blocked_until: null,
        },
    });
}

async function createSession({
    employeeId,
    sessionId,
    refreshToken,
    lastActivityAt,
    blocksLoginUntil,
    expiresAt,
}) {
    const session = await prisma.employee_session.create({
        data: {
            session_id: sessionId,
            employee_id: employeeId,
            refresh_token_hash: hashRefreshToken(refreshToken),
            is_active: true,
            last_activity_at: lastActivityAt,
            blocks_login_until: blocksLoginUntil,
            expires_at: expiresAt,
            revoked_at: null,
        },
    });

    return mapSession(session);
}

async function findBlockingSessionByEmployeeId(employeeId, now = new Date()) {
    const session = await prisma.employee_session.findFirst({
        where: {
            employee_id: employeeId,
            is_active: true,
            revoked_at: null,
            expires_at: { gt: now },
            blocks_login_until: { gt: now },
        },
        orderBy: { blocks_login_until: "desc" },
    });

    return mapSession(session);
}

async function revokeRevocableSessionsForLogin(employeeId, now = new Date()) {
    return prisma.employee_session.updateMany({
        where: {
            employee_id: employeeId,
            is_active: true,
            revoked_at: null,
            OR: [
                { expires_at: { lte: now } },
                { blocks_login_until: { lte: now } },
            ],
        },
        data: {
            is_active: false,
            revoked_at: now,
        },
    });
}

async function findSessionByRefreshToken(refreshToken) {
    const session = await prisma.employee_session.findUnique({
        where: { refresh_token_hash: hashRefreshToken(refreshToken) },
        include: {
            employee: {
                include: {
                    role: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });

    return mapSession(session);
}

async function findSessionById(sessionId) {
    const session = await prisma.employee_session.findUnique({
        where: { session_id: sessionId },
        include: {
            employee: {
                include: {
                    role: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });

    return mapSession(session);
}

async function touchSession(sessionId, { lastActivityAt, blocksLoginUntil }) {
    const session = await prisma.employee_session.update({
        where: { session_id: sessionId },
        data: {
            last_activity_at: lastActivityAt,
            blocks_login_until: blocksLoginUntil,
        },
    });

    return mapSession(session);
}

async function revokeSession(sessionId, now = new Date()) {
    const result = await prisma.employee_session.updateMany({
        where: {
            session_id: sessionId,
            revoked_at: null,
        },
        data: {
            is_active: false,
            revoked_at: now,
        },
    });

    return result.count > 0;
}

async function revokeSessionByRefreshToken(refreshToken, now = new Date()) {
    const result = await prisma.employee_session.updateMany({
        where: {
            refresh_token_hash: hashRefreshToken(refreshToken),
            revoked_at: null,
        },
        data: {
            is_active: false,
            revoked_at: now,
        },
    });

    return result.count > 0;
}

async function saveRefreshToken(employeeId, token) {
    await prisma.employee.update({
        where: { employee_id: employeeId },
        data: { refresh_token: token },
    });
}

async function rotateRefreshToken(employeeId, oldToken, newToken) {
    const result = await prisma.employee.updateMany({
        where: { employee_id: employeeId, refresh_token: oldToken },
        data: { refresh_token: newToken },
    });
    return result.count > 0;
}

async function clearRefreshToken(employeeId) {
    await prisma.employee.update({
        where: { employee_id: employeeId },
        data: { refresh_token: null },
    });
}

module.exports = {
    findEmployeeByEmail,
    updatePassword,
    setFirstLogin,
    updatePasswordAndClearFirstLogin,
    activateTwoFactorFromTempSecret,
    disableTwoFactor,
    incrementFailedAttempts,
    resetFailedAttempts,
    setBlockedUntil,
    clearLoginSecurityState,
    getEmployeeById,
    saveTempTotpSecret,
    clearTempTotpSecret,
    clearBlockedUntil,
    incrementFailedTwoFactorAuthAttempts,
    setTwoFactorAuthBlockedUntil,
    clearTwoFactorAuthSecurityState,
    createSession,
    findBlockingSessionByEmployeeId,
    revokeRevocableSessionsForLogin,
    findSessionByRefreshToken,
    findSessionById,
    touchSession,
    revokeSession,
    revokeSessionByRefreshToken,
    saveRefreshToken,
    clearRefreshToken,
    rotateRefreshToken,
};

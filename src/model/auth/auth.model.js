const prisma = require("../../prisma");

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
    saveRefreshToken,
    clearRefreshToken,
    rotateRefreshToken,
};

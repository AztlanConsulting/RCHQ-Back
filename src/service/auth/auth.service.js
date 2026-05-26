const User = require("../../model/auth/auth.model");
const { verifyPassword } = require("../../utils/password");
const { getClientIp } = require("../../utils/ip");
const { createLog } = require("../../model/log.model");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { LOG_ACTIONS } = require("../../utils/logActions");
const {
    buildSessionToken,
    buildFirstLoginJwt,
    buildPreTwoFactorAuthJwt,
} = require("../../utils/auth/authTokens");
const {
    isBlockedUntil,
    clearExpiredLoginBlock,
    clearExpiredTwoFactorAuthBlock,
} = require("../../utils/auth/authGuards");
const prisma = require("../../prisma");
const { generateRefreshToken, decodeToken } = require("../../utils/jwt");

const TEMP_TwoFactorAuth_SETUP_EXPIRATION_MINUTES = 10;
const LOGIN_BLOCK_MINUTES = 15;
const MAX_LOGIN_ATTEMPTS = 3;

async function login(req) {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const ipAddress = getClientIp(req);

    const employee = await User.findEmployeeByEmail(normalizedEmail);

    if (!employee) {
        return {
            status: 401,
            body: {
                success: false,
                code: "INVALID_CREDENTIALS",
                message: "Credenciales inválidas",
            },
        };
    }

    if (!employee.isActive) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.INACTIVE_ACCESS_DENIED,
            ipAddress,
        );

        return {
            status: 401,
            body: {
                success: false,
                code: "INVALID_CREDENTIALS",
                message: "Credenciales inválidas",
            },
        };
    }

    if (isBlockedUntil(employee.blockedUntil)) {
        return {
            status: 423,
            body: {
                success: false,
                code: "ACCOUNT_TEMPORARILY_BLOCKED",
                message:
                    "Tu cuenta está bloqueada temporalmente. Intenta más tarde.",
                blockedUntil: employee.blockedUntil,
            },
        };
    }

    await clearExpiredLoginBlock(employee);

    const passwordMatches = await verifyPassword(password, employee.pwd);

    if (!passwordMatches) {
        const attempts = await User.incrementFailedAttempts(
            employee.employeeId,
        );

        await createLog(
            employee.employeeId,
            LOG_ACTIONS.LOGIN_FAILED,
            ipAddress,
        );

        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            const blockedUntil = new Date(
                Date.now() + LOGIN_BLOCK_MINUTES * 60 * 1000,
            );

            await User.setBlockedUntil(employee.employeeId, blockedUntil);

            await createLog(
                employee.employeeId,
                LOG_ACTIONS.ACCOUNT_BLOCKED,
                ipAddress,
            );

            return {
                status: 423,
                body: {
                    success: false,
                    code: "ACCOUNT_TEMPORARILY_BLOCKED",
                    message:
                        "Tu cuenta está bloqueada temporalmente. Intenta más tarde.",
                    blockedUntil,
                },
            };
        }

        return {
            status: 401,
            body: {
                success: false,
                code: "INVALID_CREDENTIALS",
                message: "Credenciales inválidas",
            },
        };
    }

    await User.clearLoginSecurityState(employee.employeeId);

    if (employee.hasFirstLogin) {
        const firstLoginToken = buildFirstLoginJwt(employee);

        await createLog(
            employee.employeeId,
            LOG_ACTIONS.FIRST_LOGIN_PENDING_PASSWORD_CHANGE,
            ipAddress,
        );

        return {
            status: 200,
            body: {
                success: true,
                message: "Primer login requiere cambio de contraseña",
                nextStep: "CHANGE_PASSWORD_FIRST_LOGIN",
                data: {
                    firstLoginToken,
                    employeeId: employee.employeeId,
                    email: employee.email,
                    name: employee.name,
                },
            },
        };
    }

  if (employee.isActiveTwoFactorAuth) {
    const preTwoFactorAuthToken = buildPreTwoFactorAuthJwt(employee);
    return {
      status: 200,
      body: {
        success: true,
        message: "Inicio de sesión exitoso",
        isActiveTwoFactorAuth: employee.isActiveTwoFactorAuth,
        preTwoFactorAuthToken,
      },
    };
  }

  const token = await buildSessionToken(employee);
  const refreshToken = generateRefreshToken(employee);

  await User.saveRefreshToken(employee.employeeId, refreshToken);

  await createLog(employee.employeeId, LOG_ACTIONS.LOGIN_SUCCESS, ipAddress);

  return {
    status: 200,
    body: {
      success: true,
      code: "LOGIN_SUCCESS",
      message: "Inicio de sesión exitoso",
      isActiveTwoFactorAuth: employee.isActiveTwoFactorAuth,
      data: {
        refreshToken,
        token,
        user: {
          employeeId: employee.employeeId,
          email: employee.email,
          name: employee.name,
          role: employee.role,
        },
      },
    },
  };
};

async function setupTwoFactorAuth({ employeeId, ipAddress }) {
    if (!employeeId) {
        return {
            status: 401,
            body: { success: false, message: "Usuario no autenticado" },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Empleado no encontrado" },
        };
    }

    if (!employee.isActive) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_SETUP_INACTIVE,
            ipAddress,
        );

        return {
            status: 403,
            body: { success: false, message: "Accesso no permitido" },
        };
    }

    if (employee.totpSecret) {
        return {
            status: 409,
            body: {
                success: false,
                message: "TwoFactorAuth ya esta activo en esta cuenta",
            },
        };
    }

    const tempSecret = speakeasy.generateSecret({
        name: `RCHQ (${employee.email})`,
        issuer: "RCHQ",
        length: 20,
    });

    await User.saveTempTotpSecret(employee.employeeId, tempSecret.base32);

    const qrImage = await QRCode.toDataURL(tempSecret.otpauth_url);

    return {
        status: 200,
        body: {
            success: true,
            message: "TwoFactorAuth setup iniciado",
            nextStep: "VERIFY_TWO_FACTOR_AUTH_SETUP",
            data: {
                employeeId: employee.employeeId,
                qrImage,
                otpauthUrl: tempSecret.otpauth_url,
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
            body: { success: false, message: "Usuario no autenticado" },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Empleado no encontrado" },
        };
    }

    if (!employee.isActive) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_VERIFY_INACTIVE,
            ipAddress,
        );

        return {
            status: 403,
            body: { success: false, message: "Acceso no permitido" },
        };
    }

    if (!employee.tempTotpSecret) {
        return {
            status: 409,
            body: {
                success: false,
                message: "No hay configuracion pendiente de TwoFactorAuth",
            },
        };
    }

    if (!employee.tempTotpSecretCreatedAt) {
        await User.clearTempTotpSecret(employee.employeeId);
        return {
            status: 409,
            body: {
                success: false,
                message: "TwoFactorAuth pendiente de configurar",
            },
        };
    }

    const createdAt = new Date(employee.tempTotpSecretCreatedAt);
    const expiresAt = new Date(
        createdAt.getTime() +
            TEMP_TwoFactorAuth_SETUP_EXPIRATION_MINUTES * 60 * 1000,
    );

    if (expiresAt <= new Date()) {
        await User.clearTempTotpSecret(employee.employeeId);

        return {
            status: 409,
            body: {
                success: false,
                message:
                    "El tiempo de TwoFactorAuth setup ha expirado. Trate más adeltante.",
            },
        };
    }

    const verified = speakeasy.totp.verify({
        secret: employee.tempTotpSecret,
        encoding: "base32",
        token,
        window: 1,
    });

    if (!verified) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_SETUP_FAILED,
            ipAddress,
        );

        return {
            status: 400,
            body: {
                success: false,
                message: "Código inválido de TwoFactorAuth. Falló el setup.",
                nextStep: "TWO_FACTOR_AUTH_SETUP_FAILED",
                data: {
                    employeeId: employee.employeeId,
                    canRetryInSettings: true,
                },
            },
        };
    }

    await prisma.$transaction(async (tx) => {
        await User.activateTwoFactorFromTempSecret(employee.employeeId, tx);

        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_SETUP_SUCCESS,
            ipAddress,
            null,
            tx,
        );
    });

    return {
        status: 200,
        body: {
            success: true,
            message: "TwoFactorAuth activated successfully",
            nextStep: "TWO_FACTOR_AUTH_SETUP_COMPLETE",
            data: {
                employeeId: employee.employeeId,
                twoFactorEnabled: true,
            },
        },
    };
}

async function validateTwoFactorAuth(req) {
    const { token } = req.body || {};
    const employeeId = req.user?.id || req.user?.employeeId;
    const ipAddress = getClientIp(req);

    if (!employeeId) {
        return {
            status: 401,
            body: { success: false, message: "Usuario no autenticado" },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Empleado no encontrado" },
        };
    }

    if (!employee.isActive) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_VALIDATE_INACTIVE,
            ipAddress,
        );

        return {
            status: 403,
            body: { success: false, message: "Acceso no permitido" },
        };
    }

    if (!employee.totpSecret) {
        return {
            status: 409,
            body: {
                success: false,
                message: "TwoFactorAuth no esta habilitado para esta cuenta",
            },
        };
    }

    if (isBlockedUntil(employee.twoFaBlockedUntil)) {
        return {
            status: 423,
            body: {
                success: false,
                message: "TwoFactorAuth bloqueado temporalmente",
                nextStep: "WAIT_TWO_FACTOR_AUTH_BLOCK",
                blockedUntil: employee.twoFaBlockedUntil,
            },
        };
    }

    await clearExpiredTwoFactorAuthBlock(employee);

    const isValid = speakeasy.totp.verify({
        secret: employee.totpSecret,
        encoding: "base32",
        token,
        window: 1,
    });

    if (!isValid) {
        const attempts = await User.incrementFailedTwoFactorAuthAttempts(
            employee.employeeId,
        );

        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_LOGIN_FAILED,
            ipAddress,
        );

        if (attempts >= 3) {
            const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);

            await User.setTwoFactorAuthBlockedUntil(
                employee.employeeId,
                blockedUntil,
            );

            await createLog(
                employee.employeeId,
                LOG_ACTIONS.TWO_FA_BLOCKED,
                ipAddress,
            );

            return {
                status: 423,
                body: {
                    success: false,
                    message: "TwoFactorAuth bloqueado temporalmente",
                    nextStep: "WAIT_TWO_FACTOR_AUTH_BLOCK",
                    blockedUntil,
                },
            };
        }

        return {
            status: 401,
            body: { success: false, message: "Invalido TwoFactorAuth token" },
        };
    }

  await User.clearTwoFactorAuthSecurityState(employee.employeeId);

  const tokenJwt = await buildSessionToken(employee);
  const refreshToken = generateRefreshToken(employee);

  await User.saveRefreshToken(employee.employeeId, refreshToken);

  await createLog(
    employee.employeeId,
    LOG_ACTIONS.TWO_FA_LOGIN_SUCCESS,
    ipAddress,
  );

  return {
    status: 200,
    body: {
      success: true,
      message: "TwoFactorAuth validacion correcta",
      nextStep: "LOGIN_COMPLETE",
      token: tokenJwt,
      refreshToken,
      data: {
        employeeId: employee.employeeId,
        email: employee.email,
        name: employee.name,
        role: employee.role,
      },
    },
  };
}

async function getTwoFactorAuthStatus(req) {
    const employeeId = req.user?.id;
    const ipAddress = getClientIp(req);

    if (!employeeId) {
        return {
            status: 404,
            body: { success: false, message: "Usuario no encontrado" },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Usuario no encontrado" },
        };
    }
    if (!employee.isActive) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_DISABLE_INACTIVE,
            ipAddress,
        );

        return {
            status: 403,
            body: { success: false, message: "Acceso no permitido" },
        };
    }

    return {
        status: 200,
        body: {
            success: true,
            StatusTwoFactorAuth: employee.isActiveTwoFactorAuth,
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
            body: { success: false, message: "Usuario no autentificado" },
        };
    }

    if (!password) {
        return {
            status: 400,
            body: {
                success: false,
                message: "Password is required to disable TwoFactorAuth",
            },
        };
    }

    const employee = await User.getEmployeeById(employeeId);

    if (!employee) {
        return {
            status: 404,
            body: { success: false, message: "Empleado no encontrado" },
        };
    }

    if (!employee.isActive) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_DISABLE_INACTIVE,
            ipAddress,
        );

        return {
            status: 403,
            body: { success: false, message: "Acceso no permitido" },
        };
    }

    if (!employee.totpSecret) {
        return {
            status: 409,
            body: {
                success: false,
                message: "TwoFactorAuth no esta activo para esta cuenta",
            },
        };
    }

    const passwordMatches = await verifyPassword(password, employee.pwd);

    if (!passwordMatches) {
        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_DISABLE_WRONG_PASSWORD,
            ipAddress,
        );

        return {
            status: 401,
            body: { success: false, message: "Credenciales inválidas" },
        };
    }

    await prisma.$transaction(async (tx) => {
        await User.disableTwoFactor(employee.employeeId, tx);

        await createLog(
            employee.employeeId,
            LOG_ACTIONS.TWO_FA_DISABLED,
            ipAddress,
            null,
            tx,
        );
    });

    return {
        status: 200,
        body: {
            success: true,
            message: "TwoFactorAuth deshabilitado correctamente",
            nextStep: "TWO_FACTOR_AUTH_DISABLED",
            data: {
                employeeId: employee.employeeId,
                twoFactorEnabled: false,
                isActiveTwoFactorAuth: false,
            },
        },
    };
}

async function refreshSession(refreshToken, ipAddress) {
    if (!refreshToken) {
        return { status: 401, body: { success: false, message: "Token no proporcionado", code: "INVALID_REFRESH_TOKEN" } };
    }

    const decoded = decodeToken(refreshToken);
    if (!decoded || decoded.tokenType !== "REFRESH") {
        return { status: 401, body: { success: false, message: "Token inválido o expirado", code: "INVALID_REFRESH_TOKEN" } };
    }

    const employeeId = decoded.id || decoded.employeeId;
    const employee = await User.getEmployeeById(employeeId);

    if (!employee || !employee.isActive) {
        return { status: 403, body: { success: false, message: "Acceso denegado", code: "INVALID_REFRESH_TOKEN" } };
    }

    if (employee.refreshToken !== refreshToken) {
        await User.clearRefreshToken(employeeId);
        return { status: 401, body: { success: false, message: "Sesión inválida", code: "INVALID_REFRESH_TOKEN" } };
    }

    const newToken = await buildSessionToken(employee);
    const newRefreshToken = generateRefreshToken(employee);
    await User.saveRefreshToken(employee.employeeId, newRefreshToken);

    return {
        status: 200,
        body: {
            success: true,
            code: "REFRESH_SUCCESS",
            message: "Sesión actualizada",
            data: {
                token: newToken,
                refreshToken: newRefreshToken,
            },
        },
    };
}

async function logout(refreshToken) {
    if (refreshToken) {
        const decoded = decodeToken(refreshToken);
        if (decoded && (decoded.id || decoded.employeeId)) {
            await User.clearRefreshToken(decoded.id || decoded.employeeId);
        }
    }
    return { status: 200, body: { success: true, message: "Sesión cerrada", code: "LOGOUT_SUCCESS" } };
}

module.exports = {
    login,
    setupTwoFactorAuth,
    verifyTwoFactorSetup,
    validateTwoFactorAuth,
    getTwoFactorAuthStatus,
    disableTwoFactorAuth,
    refreshSession,
    logout,
};

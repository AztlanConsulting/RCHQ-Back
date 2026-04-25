const User = require("../model/user.model");
const { verifyPassword } = require("../utils/password");
const { getClientIp } = require("../utils/ip");
const { createLog } = require("../model/log.model");
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
const prisma = require("../prisma");

const TEMP_2FA_SETUP_EXPIRATION_MINUTES = 10;
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
        message: "Tu cuenta está bloqueada temporalmente. Intenta más tarde.",
        blockedUntil: employee.blockedUntil,
      },
    };
  }

  await clearExpiredLoginBlock(employee);

  const passwordMatches = await verifyPassword(password, employee.pwd);

  if (!passwordMatches) {
    const attempts = await User.incrementFailedAttempts(employee.employeeId);

    await createLog(employee.employeeId, LOG_ACTIONS.LOGIN_FAILED, ipAddress);

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
          message: "Tu cuenta está bloqueada temporalmente. Intenta más tarde.",
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
        message: "First login requires password change",
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

  if (employee.isActive2FA) {
    const pre2FAToken = buildPre2faJwt(employee);
    return {
      status: 200,
      body: {
        success: true,
        message: "Inicio de sesión exitoso",
        isActive2FA: employee.isActive2FA,
        pre2FAToken,
      },
    };
  }

  const token = buildSessionToken(employee);

  await createLog(employee.employeeId, LOG_ACTIONS.LOGIN_SUCCESS, ipAddress);

  return {
    status: 200,
    body: {
      success: true,
      message: "Inicio de sesión exitoso",
      isActive2FA: employee.isActive2FA,
      data: {
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
}

async function setupTwoFactorAuth({
  employeeId,
  ipAddress,
}) {
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

  if (!employee.isActive) {
    await createLog(
      employee.employeeId,
      LOG_ACTIONS.TWO_FA_SETUP_INACTIVE,
      ipAddress,
    );

    return {
      status: 403,
      body: { success: false, message: "Access not allowed" },
    };
  }

  if (employee.totpSecret) {
    return {
      status: 409,
      body: {
        success: false,
        message: "2FA is already enabled for this account",
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
      message: "2FA setup started",
      nextStep: "VERIFY_2FA_SETUP",
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

  if (!employee.isActive) {
    await createLog(
      employee.employeeId,
      LOG_ACTIONS.TWO_FA_VERIFY_INACTIVE,
      ipAddress,
    );

    return {
      status: 403,
      body: { success: false, message: "Access not allowed" },
    };
  }

  if (!employee.tempTotpSecret) {
    return {
      status: 409,
      body: { success: false, message: "No pending 2FA setup found" },
    };
  }

  if (!employee.tempTotpSecretCreatedAt) {
    await User.clearTempTotpSecret(employee.employeeId);
    return {
      status: 409,
      body: {
        success: false,
        message: "Invalid pending 2FA setup state",
      },
    };
  }

  const createdAt = new Date(employee.tempTotpSecretCreatedAt);
  const expiresAt = new Date(
    createdAt.getTime() + TEMP_2FA_SETUP_EXPIRATION_MINUTES * 60 * 1000,
  );

  if (expiresAt <= new Date()) {
    await User.clearTempTotpSecret(employee.employeeId);

    return {
      status: 409,
      body: {
        success: false,
        message: "Pending 2FA setup has expired. Please start again.",
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
        message: "Invalid 2FA code. Setup could not be completed.",
        nextStep: "2FA_SETUP_FAILED",
        data: {
          employeeId: employee.employeeId,
          canRetryInSettings: true,
        },
      },
    };
  }

  await prisma.$transaction(async (tx) => {
    const employeeInTx = await tx.employee.findUnique({
      where: { employee_id: employee.employeeId },
      select: {
        temp_totp_secret: true,
      },
    });

    await tx.employee.update({
      where: { employee_id: employee.employeeId },
      data: {
        totp_secret: employeeInTx?.temp_totp_secret ?? null,
        temp_totp_secret: null,
        temp_totp_secret_created_at: null,
        is_active_2fa: true,
      },
    });

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
      message: "2FA activated successfully",
      nextStep: "2FA_SETUP_COMPLETE",
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

  if (!employee.isActive) {
    await createLog(
      employee.employeeId,
      LOG_ACTIONS.TWO_FA_VALIDATE_INACTIVE,
      ipAddress,
    );

    return {
      status: 403,
      body: { success: false, message: "Access not allowed" },
    };
  }

  if (!employee.totpSecret) {
    return {
      status: 409,
      body: { success: false, message: "2FA is not enabled for this account" },
    };
  }

  if (isBlockedUntil(employee.twoFaBlockedUntil)) {
    return {
      status: 423,
      body: {
        success: false,
        message: "2FA temporarily blocked",
        nextStep: "WAIT_2FA_BLOCK",
        blockedUntil: employee.twoFaBlockedUntil,
      },
    };
  }

  await clearExpired2FABlock(employee);

  const isValid = speakeasy.totp.verify({
    secret: employee.totpSecret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!isValid) {
    const attempts = await User.incrementFailed2FAAttempts(employee.employeeId);

    await createLog(
      employee.employeeId,
      LOG_ACTIONS.TWO_FA_LOGIN_FAILED,
      ipAddress,
    );

    if (attempts >= 3) {
      const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);

      await User.set2FABlockedUntil(employee.employeeId, blockedUntil);

      await createLog(
        employee.employeeId,
        LOG_ACTIONS.TWO_FA_BLOCKED,
        ipAddress,
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

  await User.clear2FASecurityState(employee.employeeId);

  const tokenJwt = buildSessionToken(employee);

  await createLog(
    employee.employeeId,
    LOG_ACTIONS.TWO_FA_LOGIN_SUCCESS,
    ipAddress,
  );

  return {
    status: 200,
    body: {
      success: true,
      message: "2FA validation successful",
      nextStep: "LOGIN_COMPLETE",
      token: tokenJwt,
      data: {
        employeeId: employee.employeeId,
        email: employee.email,
        name: employee.name,
        role: employee.role,
      },
    },
  };
}

async function getStatus2FA(req) {
  const employeeId = req.user?.id;
  const ipAddress = getClientIp(req);

  if (!employeeId) {
    return {
      status: 404,
      body: { success: false, message: "User not found" },
    };
  }

  const employee = await User.getEmployeeById(employeeId);

  if (!employee) {
    return {
      status: 404,
      body: { success: false, message: "User not found" },
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
      body: { success: false, message: "Access not allowed" },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      Status2FA: employee.isActive2FA,
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

  if (!employee.isActive) {
    await createLog(
      employee.employeeId,
      LOG_ACTIONS.TWO_FA_DISABLE_INACTIVE,
      ipAddress,
    );

    return {
      status: 403,
      body: { success: false, message: "Access not allowed" },
    };
  }

  if (!employee.totpSecret) {
    return {
      status: 409,
      body: { success: false, message: "2FA is not enabled for this account" },
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
      body: { success: false, message: "Invalid credentials" },
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { employee_id: employee.employeeId },
      data: {
        totp_secret: null,
        temp_totp_secret: null,
        temp_totp_secret_created_at: null,
        is_active_2fa: false,
      },
    });

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
      message: "2FA disabled successfully",
      nextStep: "2FA_DISABLED",
      data: {
        employeeId: employee.employeeId,
        twoFactorEnabled: false,
        isActive2FA: false,
      },
    },
  };
}

module.exports = {
  login,
  setupTwoFactorAuth,
  verifyTwoFactorSetup,
  validateTwoFactorAuth,
  getStatus2FA,
  disableTwoFactorAuth,
};

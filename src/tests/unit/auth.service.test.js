jest.mock("../../model/user.model", () => ({
  findEmployeeByEmail: jest.fn(),
  getEmployeeById: jest.fn(),
  incrementFailedAttempts: jest.fn(),
  setBlockedUntil: jest.fn(),
  clearLoginSecurityState: jest.fn(),
  saveTempTotpSecret: jest.fn(),
  clearTempTotpSecret: jest.fn(),
  incrementFailed2FAAttempts: jest.fn(),
  set2FABlockedUntil: jest.fn(),
  clear2FASecurityState: jest.fn(),
  activateTwoFactorFromTempSecret: jest.fn(),
  disableTwoFactor: jest.fn(),
}));

jest.mock("../../utils/password", () => ({
  verifyPassword: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
  createLog: jest.fn(),
}));

jest.mock("../../utils/ip", () => ({
  getClientIp: jest.fn(),
}));

jest.mock("../../utils/auth/authTokens", () => ({
  buildSessionToken: jest.fn(),
  buildFirstLoginJwt: jest.fn(),
  buildPre2faJwt: jest.fn(),
}));

jest.mock("../../utils/auth/authGuards", () => ({
  isBlockedUntil: jest.fn(),
  clearExpiredLoginBlock: jest.fn(),
  clearExpired2FABlock: jest.fn(),
}));

jest.mock("../../prisma", () => ({
  $transaction: jest.fn((cb) =>
    cb({ employee: { findUnique: jest.fn(), update: jest.fn() } }),
  ),
}));

jest.mock("speakeasy", () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn(),
  },
}));

jest.mock("qrcode", () => ({
  toDataURL: jest.fn(),
}));

const User = require("../../model/user.model");
const { verifyPassword } = require("../../utils/password");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const {
  buildSessionToken,
  buildFirstLoginJwt,
  buildPre2faJwt,
} = require("../../utils/auth/authTokens");
const {
  isBlockedUntil,
  clearExpiredLoginBlock,
  clearExpired2FABlock,
} = require("../../utils/auth/authGuards");
const prisma = require("../../prisma");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const {
  login,
  setupTwoFactorAuth,
  verifyTwoFactorSetup,
  validateTwoFactorAuth,
  getStatus2FA,
  disableTwoFactorAuth,
} = require("../../service/auth/auth.service");

// ─── Mocks ────────────────────────────────────────────────

jest.mock("../../model/auth/auth.model");
jest.mock("../../utils/password");
jest.mock("../../model/log.model");
jest.mock("../../utils/ip");
jest.mock("../../utils/auth/authTokens");
jest.mock("../../utils/auth/authGuards");
jest.mock("../../prisma", () => ({
  $transaction: jest.fn((cb) =>
    cb({ employee: { findUnique: jest.fn(), update: jest.fn() } }),
  ),
}));
jest.mock("speakeasy");
jest.mock("qrcode");

const User = require("../../model/auth/auth.model");
const { verifyPassword } = require("../../utils/password");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const {
  buildSessionToken,
  buildPre2faJwt,
} = require("../../utils/auth/authTokens");
const {
  isBlockedUntil,
  clearExpiredLoginBlock,
  clearExpired2FABlock,
} = require("../../utils/auth/authGuards");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

// ─── Fixtures ─────────────────────────────────────────────

const mockEmployee = {
  employeeId: "abc-123",
  email: "test@gmail.com",
  name: "Test User",
  role: "admin",
  isActive: true,
  hasFirstLogin: false,
  isActive2FA: false,
  blockedUntil: null,
  twoFaBlockedUntil: null,
  pwd: "hashedPassword",
  totpSecret: null,
  tempTotpSecret: null,
  tempTotpSecretCreatedAt: null,
};

const makeReq = (body = {}, user = null) => ({
  body,
  ip: "127.0.0.1",
  headers: {},
  socket: { remoteAddress: "127.0.0.1" },
  user,
});

beforeEach(() => {
  jest.clearAllMocks();
  getClientIp.mockReturnValue("127.0.0.1");
  isBlockedUntil.mockReturnValue(false);
  clearExpiredLoginBlock.mockResolvedValue();
  clearExpired2FABlock.mockResolvedValue();
  createLog.mockResolvedValue();
  buildSessionToken.mockReturnValue("fake-session-token");
  buildFirstLoginJwt.mockReturnValue("fake-first-login-token");
  buildPre2faJwt.mockReturnValue("fake-pre2fa-token");
});

describe("login", () => {
  it("retorna 401 si el usuario no existe", async () => {
    User.findEmployeeByEmail.mockResolvedValue(null);

    const result = await login(
      makeReq({ email: "no@existe.com", password: "pass" }),
    );

    expect(result.status).toBe(401);
    expect(result.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("retorna 401 si el usuario está inactivo", async () => {
    User.findEmployeeByEmail.mockResolvedValue({
      ...mockEmployee,
      isActive: false,
    });

    const result = await login(
      makeReq({ email: "test@gmail.com", password: "pass" }),
    );

    expect(result.status).toBe(401);
    expect(createLog).toHaveBeenCalled();
  });

  it("retorna 423 si la cuenta está bloqueada", async () => {
    const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    User.findEmployeeByEmail.mockResolvedValue({
      ...mockEmployee,
      blockedUntil,
    });
    isBlockedUntil.mockReturnValue(true);

    const result = await login(
      makeReq({ email: "test@gmail.com", password: "pass" }),
    );

    expect(result.status).toBe(423);
    expect(result.body.code).toBe("ACCOUNT_TEMPORARILY_BLOCKED");
    expect(result.body).toHaveProperty("blockedUntil");
  });

  it("retorna 401 con contraseña incorrecta sin bloqueo", async () => {
    User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
    verifyPassword.mockResolvedValue(false);
    User.incrementFailedAttempts.mockResolvedValue(1);

    const result = await login(
      makeReq({ email: "test@gmail.com", password: "wrong" }),
    );

    expect(result.status).toBe(401);
    expect(result.body.code).toBe("INVALID_CREDENTIALS");
    expect(User.incrementFailedAttempts).toHaveBeenCalledWith(
      mockEmployee.employeeId,
    );
    expect(createLog).toHaveBeenCalled();
  });

  it("bloquea la cuenta y retorna 423 al llegar a 3 intentos fallidos", async () => {
    User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
    verifyPassword.mockResolvedValue(false);
    User.incrementFailedAttempts.mockResolvedValue(3);
    User.setBlockedUntil.mockResolvedValue();

    const result = await login(
      makeReq({ email: "test@gmail.com", password: "wrong" }),
    );

    expect(result.status).toBe(423);
    expect(result.body.code).toBe("ACCOUNT_TEMPORARILY_BLOCKED");
    expect(User.setBlockedUntil).toHaveBeenCalled();
  });

  it("retorna token de primer login cuando hasFirstLogin es true", async () => {
    User.findEmployeeByEmail.mockResolvedValue({
      ...mockEmployee,
      hasFirstLogin: true,
    });
    verifyPassword.mockResolvedValue(true);
    User.clearLoginSecurityState.mockResolvedValue();

    const result = await login(
      makeReq({ email: "test@gmail.com", password: "correct" }),
    );

    expect(result.status).toBe(200);
    expect(result.body.nextStep).toBe("CHANGE_PASSWORD_FIRST_LOGIN");
    expect(result.body.data).toHaveProperty(
      "firstLoginToken",
      "fake-first-login-token",
    );
    expect(buildFirstLoginJwt).toHaveBeenCalled();
  });

  it("retorna token de sesión con credenciales válidas y sin 2FA activo", async () => {
    User.findEmployeeByEmail.mockResolvedValue({
      ...mockEmployee,
      hasFirstLogin: false,
      isActive2FA: false,
    });
    verifyPassword.mockResolvedValue(true);
    User.clearLoginSecurityState.mockResolvedValue();

    const result = await login(
      makeReq({ email: "test@gmail.com", password: "correct" }),
    );

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data).toHaveProperty("token", "fake-session-token");
    expect(result.body.isActive2FA).toBe(false);
    expect(createLog).toHaveBeenCalled();
  });

  it("retorna pre2FAToken cuando el usuario tiene 2FA activo", async () => {
    User.findEmployeeByEmail.mockResolvedValue({
      ...mockEmployee,
      hasFirstLogin: false,
      isActive2FA: true,
    });
    verifyPassword.mockResolvedValue(true);
    User.clearLoginSecurityState.mockResolvedValue();

    const result = await login(
      makeReq({ email: "test@gmail.com", password: "correct" }),
    );

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("pre2FAToken", "fake-pre2fa-token");
    expect(result.body.isActive2FA).toBe(true);
    expect(result.body.data).toBeUndefined();
  });

  it("limpia el bloqueo expirado antes de verificar la contraseña", async () => {
    User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
    verifyPassword.mockResolvedValue(true);
    User.clearLoginSecurityState.mockResolvedValue();

    await login(makeReq({ email: "test@gmail.com", password: "correct" }));

    expect(clearExpiredLoginBlock).toHaveBeenCalledWith(mockEmployee);
  });
});

describe("setupTwoFactorAuth", () => {
  it("retorna 401 si no hay employeeId en el token", async () => {
    const result = await setupTwoFactorAuth({
      employeeId: null,
      ipAddress: "127.0.0.1",
    });

    expect(result.status).toBe(401);
  });

  it("retorna 404 si el empleado no existe en la BD", async () => {
    User.getEmployeeById.mockResolvedValue(null);

    const result = await setupTwoFactorAuth({
      employeeId: "abc-123",
      ipAddress: "127.0.0.1",
    });

    expect(result.status).toBe(404);
  });

  it("retorna 403 si el empleado está inactivo", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      isActive: false,
    });

    const result = await setupTwoFactorAuth({
      employeeId: "abc-123",
      ipAddress: "127.0.0.1",
    });

    expect(result.status).toBe(403);
    expect(createLog).toHaveBeenCalled();
  });

  it("retorna 409 si el 2FA ya está configurado (totpSecret existe)", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      totpSecret: "EXISTINGSECRET",
    });

    const result = await setupTwoFactorAuth({
      employeeId: "abc-123",
      ipAddress: "127.0.0.1",
    });

    expect(result.status).toBe(409);
  });

  it("retorna QR e imagen si todo es válido", async () => {
    User.getEmployeeById.mockResolvedValue(mockEmployee);
    User.saveTempTotpSecret.mockResolvedValue();
    speakeasy.generateSecret.mockReturnValue({
      base32: "SECRETBASE32",
      otpauth_url: "otpauth://totp/RCHQ?secret=SECRETBASE32",
    });
    QRCode.toDataURL.mockResolvedValue("data:image/png;base64,fake");

    const result = await setupTwoFactorAuth({
      employeeId: "abc-123",
      ipAddress: "127.0.0.1",
    });

    expect(result.status).toBe(200);
    expect(result.body.data).toHaveProperty(
      "qrImage",
      "data:image/png;base64,fake",
    );
    expect(result.body.nextStep).toBe("VERIFY_2FA_SETUP");
    expect(User.saveTempTotpSecret).toHaveBeenCalledWith(
      "abc-123",
      "SECRETBASE32",
    );
  });
});

describe("verifyTwoFactorSetup", () => {
  it("retorna 401 si no hay employeeId en el token", async () => {
    const result = await verifyTwoFactorSetup(
      makeReq({ token: "123456" }, null),
    );

    expect(result.status).toBe(401);
  });

  it("retorna 404 si el empleado no existe", async () => {
    User.getEmployeeById.mockResolvedValue(null);

    const result = await verifyTwoFactorSetup(
      makeReq({ token: "123456" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(404);
  });

  it("retorna 409 si no hay setup de 2FA pendiente (sin tempTotpSecret)", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      tempTotpSecret: null,
    });

    const result = await verifyTwoFactorSetup(
      makeReq({ token: "123456" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(409);
  });

  it("retorna 409 si el setup de 2FA expiró", async () => {
    const createdAt = new Date(Date.now() - 20 * 60 * 1000);
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      tempTotpSecret: "SECRETBASE32",
      tempTotpSecretCreatedAt: createdAt,
    });
    User.clearTempTotpSecret.mockResolvedValue();

    const result = await verifyTwoFactorSetup(
      makeReq({ token: "123456" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(409);
    expect(User.clearTempTotpSecret).toHaveBeenCalled();
  });

  it("retorna 400 si el token TOTP es inválido", async () => {
    const createdAt = new Date();
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      tempTotpSecret: "SECRETBASE32",
      tempTotpSecretCreatedAt: createdAt,
    });
    speakeasy.totp.verify.mockReturnValue(false);

    const result = await verifyTwoFactorSetup(
      makeReq({ token: "000000" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(400);
    expect(result.body.nextStep).toBe("2FA_SETUP_FAILED");
  });

  it("activa 2FA correctamente cuando el token es válido", async () => {
    const createdAt = new Date();
    const mockTx = {};
    prisma.$transaction.mockImplementation((cb) => cb(mockTx));
    User.activateTwoFactorFromTempSecret.mockResolvedValue();

    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      tempTotpSecret: "SECRETBASE32",
      tempTotpSecretCreatedAt: createdAt,
    });
    speakeasy.totp.verify.mockReturnValue(true);

    const result = await verifyTwoFactorSetup(
      makeReq({ token: "123456" }, { id: "abc-123" }),
    );

    expect(User.activateTwoFactorFromTempSecret).toHaveBeenCalledWith(
      "abc-123",
      mockTx,
    );
    expect(result.status).toBe(200);
    expect(result.body.nextStep).toBe("2FA_SETUP_COMPLETE");
  });
});

describe("validateTwoFactorAuth", () => {
  it("retorna 401 si no hay employeeId en el token", async () => {
    const result = await validateTwoFactorAuth(
      makeReq({ token: "123456" }, null),
    );

    expect(result.status).toBe(401);
  });

  it("retorna 404 si el empleado no existe", async () => {
    User.getEmployeeById.mockResolvedValue(null);

    const result = await validateTwoFactorAuth(
      makeReq({ token: "123456" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(404);
  });

  it("retorna 409 si el 2FA no está habilitado (sin totpSecret)", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      totpSecret: null,
    });

    const result = await validateTwoFactorAuth(
      makeReq({ token: "123456" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(409);
  });

  it("retorna 423 si el 2FA está bloqueado por intentos fallidos", async () => {
    const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      totpSecret: "SECRET",
      twoFaBlockedUntil: blockedUntil,
    });
    isBlockedUntil.mockReturnValue(true);

    const result = await validateTwoFactorAuth(
      makeReq({ token: "000000" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(423);
    expect(result.body.nextStep).toBe("WAIT_2FA_BLOCK");
  });

  it("retorna 401 si el código 2FA es incorrecto", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      totpSecret: "SECRET",
    });
    speakeasy.totp.verify.mockReturnValue(false);
    User.incrementFailed2FAAttempts.mockResolvedValue(1);

    const result = await validateTwoFactorAuth(
      makeReq({ token: "000000" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(401);
    expect(User.incrementFailed2FAAttempts).toHaveBeenCalled();
  });

  it("bloquea el 2FA al llegar a 3 intentos fallidos", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      totpSecret: "SECRET",
    });
    speakeasy.totp.verify.mockReturnValue(false);
    User.incrementFailed2FAAttempts.mockResolvedValue(3);
    User.set2FABlockedUntil.mockResolvedValue();

    const result = await validateTwoFactorAuth(
      makeReq({ token: "000000" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(423);
    expect(User.set2FABlockedUntil).toHaveBeenCalled();
  });

  it("retorna token de sesión cuando el código 2FA es correcto", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      totpSecret: "SECRET",
    });
    speakeasy.totp.verify.mockReturnValue(true);
    User.clear2FASecurityState.mockResolvedValue();

    const result = await validateTwoFactorAuth(
      makeReq({ token: "123456" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("token", "fake-session-token");
    expect(result.body.nextStep).toBe("LOGIN_COMPLETE");
    expect(User.clear2FASecurityState).toHaveBeenCalled();
  });
});

describe("getStatus2FA", () => {
  it("retorna 404 si no hay employeeId en el token", async () => {
    const result = await getStatus2FA(makeReq({}, null));
    expect(result.status).toBe(404);
  });

  it("retorna 404 si el empleado no existe en la BD", async () => {
    User.getEmployeeById.mockResolvedValue(null);

    const result = await getStatus2FA(makeReq({}, { id: "abc-123" }));

    expect(result.status).toBe(404);
  });

  it("retorna 403 si el empleado está inactivo", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      isActive: false,
    });

    const result = await getStatus2FA(makeReq({}, { id: "abc-123" }));

    expect(result.status).toBe(403);
  });

  it("retorna false cuando el 2FA no está activo", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      isActive2FA: false,
    });

    const result = await getStatus2FA(makeReq({}, { id: "abc-123" }));

    expect(result.status).toBe(200);
    expect(result.body.Status2FA).toBe(false);
  });

  it("retorna true cuando el 2FA está activo", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      isActive2FA: true,
      totpSecret: "SECRET",
    });

    const result = await getStatus2FA(makeReq({}, { id: "abc-123" }));

    expect(result.status).toBe(200);
    expect(result.body.Status2FA).toBe(true);
  });
});

describe("disableTwoFactorAuth", () => {
  it("retorna 401 si no hay employeeId en el token", async () => {
    const result = await disableTwoFactorAuth(
      makeReq({ password: "pass" }, null),
    );

    expect(result.status).toBe(401);
  });

  it("retorna 400 si no se envía la contraseña", async () => {
    const result = await disableTwoFactorAuth(makeReq({}, { id: "abc-123" }));
    expect(result.status).toBe(400);
  });

  it("retorna 404 si el empleado no existe", async () => {
    User.getEmployeeById.mockResolvedValue(null);

    const result = await disableTwoFactorAuth(
      makeReq({ password: "pass" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(404);
  });

  it("retorna 403 si el empleado está inactivo", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      isActive: false,
      totpSecret: "SECRET",
    });

    const result = await disableTwoFactorAuth(
      makeReq({ password: "pass" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(403);
    expect(createLog).toHaveBeenCalled();
  });

  it("retorna 409 si el 2FA no está activo", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      totpSecret: null,
    });

    const result = await disableTwoFactorAuth(
      makeReq({ password: "pass" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(409);
  });

  it("retorna 401 con contraseña incorrecta", async () => {
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      totpSecret: "SECRET",
    });
    verifyPassword.mockResolvedValue(false);

    const result = await disableTwoFactorAuth(
      makeReq({ password: "wrong" }, { id: "abc-123" }),
    );

    expect(result.status).toBe(401);
    expect(createLog).toHaveBeenCalled();
  });

  it("desactiva 2FA correctamente y limpia los secrets", async () => {
    const mockTx = {};
    prisma.$transaction.mockImplementation((cb) => cb(mockTx));
    User.disableTwoFactor.mockResolvedValue();
    
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      totpSecret: "SECRET",
    });
    verifyPassword.mockResolvedValue(true);

    const result = await disableTwoFactorAuth(
      makeReq({ password: "correct" }, { id: "abc-123" }),
    );

    expect(User.disableTwoFactor).toHaveBeenCalledWith("abc-123", mockTx);
    expect(result.status).toBe(200);
    expect(result.body.nextStep).toBe("2FA_DISABLED");
    expect(result.body.data.twoFactorEnabled).toBe(false);
  });
});
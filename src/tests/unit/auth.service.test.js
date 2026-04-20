// tests/unit/auth.service.test.js
const {
  login,
  setupTwoFactorAuth,
  verifyTwoFactorSetup,
  validateTwoFactorAuth,
  getStatus2FA,
  disableTwoFactorAuth,
} = require("../../service/auth.service");

// ─── Mocks ────────────────────────────────────────────────

jest.mock("../../model/user.model");
jest.mock("../../utils/password");
jest.mock("../../model/log.model");
jest.mock("../../utils/ip");
jest.mock("../../utils/auth/authTokens");
jest.mock("../../utils/auth/authGuards");
jest.mock("../../prisma", () => ({
  $transaction: jest.fn((cb) =>
    cb({ employee: { findUnique: jest.fn(), update: jest.fn() } })
  ),
}));
jest.mock("speakeasy");
jest.mock("qrcode");

const User = require("../../model/user.model");
const { verifyPassword } = require("../../utils/password");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { buildSessionToken, buildPre2faJwt } = require("../../utils/auth/authTokens");
const { isBlockedUntil, clearExpiredLoginBlock, clearExpired2FABlock } = require("../../utils/auth/authGuards");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

// ─── Fixtures ─────────────────────────────────────────────

const mockEmployee = {
  employeeId: "abc-123",
  email: "test@gmail.com",
  name: "Test User",
  role: "admin",
  isActive: true,
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
  buildPre2faJwt.mockReturnValue("fake-pre2fa-token");
});

// ─── LOGIN ────────────────────────────────────────────────

describe("login", () => {
  it("retorna 401 si el usuario no existe", async () => {
    // Arrange
    User.findEmployeeByEmail.mockResolvedValue(null);

    // Act
    const result = await login(makeReq({ email: "no@existe.com", password: "pass" }));

    // Assert
    expect(result.status).toBe(401);
    expect(result.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("retorna 401 si el usuario está inactivo", async () => {
    // Arrange
    User.findEmployeeByEmail.mockResolvedValue({ ...mockEmployee, isActive: false });

    // Act
    const result = await login(makeReq({ email: "test@gmail.com", password: "pass" }));

    // Assert
    expect(result.status).toBe(401);
    expect(createLog).toHaveBeenCalled();
  });

  it("retorna 423 si la cuenta está bloqueada", async () => {
    // Arrange
    const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    User.findEmployeeByEmail.mockResolvedValue({ ...mockEmployee, blockedUntil });
    isBlockedUntil.mockReturnValue(true);

    // Act
    const result = await login(makeReq({ email: "test@gmail.com", password: "pass" }));

    // Assert
    expect(result.status).toBe(423);
    expect(result.body.code).toBe("ACCOUNT_TEMPORARILY_BLOCKED");
    expect(result.body).toHaveProperty("blockedUntil");
  });

  it("retorna 401 con contraseña incorrecta sin bloqueo", async () => {
    // Arrange
    User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
    verifyPassword.mockResolvedValue(false);
    User.incrementFailedAttempts.mockResolvedValue(1);

    // Act
    const result = await login(makeReq({ email: "test@gmail.com", password: "wrong" }));

    // Assert
    expect(result.status).toBe(401);
    expect(result.body.code).toBe("INVALID_CREDENTIALS");
    expect(User.incrementFailedAttempts).toHaveBeenCalledWith(mockEmployee.employeeId);
    expect(createLog).toHaveBeenCalled();
  });

  it("bloquea la cuenta y retorna 423 al llegar a 3 intentos fallidos", async () => {
    // Arrange
    User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
    verifyPassword.mockResolvedValue(false);
    User.incrementFailedAttempts.mockResolvedValue(3);
    User.setBlockedUntil.mockResolvedValue();

    // Act
    const result = await login(makeReq({ email: "test@gmail.com", password: "wrong" }));

    // Assert
    expect(result.status).toBe(423);
    expect(result.body.code).toBe("ACCOUNT_TEMPORARILY_BLOCKED");
    expect(User.setBlockedUntil).toHaveBeenCalled();
  });

  it("retorna token de sesión con credenciales válidas y sin 2FA activo", async () => {
    // Arrange
    User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
    verifyPassword.mockResolvedValue(true);
    User.clearLoginSecurityState.mockResolvedValue();

    // Act
    const result = await login(makeReq({ email: "test@gmail.com", password: "correct" }));

    // Assert
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data).toHaveProperty("token", "fake-session-token");
    expect(result.body.isActive2FA).toBe(false);
    expect(createLog).toHaveBeenCalled();
  });

  it("retorna pre2FAToken cuando el usuario tiene 2FA activo", async () => {
    // Arrange
    User.findEmployeeByEmail.mockResolvedValue({ ...mockEmployee, isActive2FA: true });
    verifyPassword.mockResolvedValue(true);
    User.clearLoginSecurityState.mockResolvedValue();

    // Act
    const result = await login(makeReq({ email: "test@gmail.com", password: "correct" }));

    // Assert
    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("pre2FAToken", "fake-pre2fa-token");
    expect(result.body.isActive2FA).toBe(true);
    expect(result.body.data).toBeUndefined();
  });

  it("limpia el bloqueo expirado antes de verificar la contraseña", async () => {
    // Arrange
    User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
    verifyPassword.mockResolvedValue(true);
    User.clearLoginSecurityState.mockResolvedValue();

    // Act
    await login(makeReq({ email: "test@gmail.com", password: "correct" }));

    // Assert
    expect(clearExpiredLoginBlock).toHaveBeenCalledWith(mockEmployee);
  });
});

// ─── SETUP 2FA ────────────────────────────────────────────

describe("setupTwoFactorAuth", () => {
  it("retorna 401 si no hay employeeId en el body", async () => {
    // Arrange / Act
    const result = await setupTwoFactorAuth(makeReq({}, { id: null }));

    // Assert
    expect(result.status).toBe(401);
  });

  it("retorna 404 si el empleado no existe en la BD", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue(null);

    // Act
    const result = await setupTwoFactorAuth(makeReq({},{ id: "abc-123" }));

    // Assert
    expect(result.status).toBe(404);
  });

  it("retorna 403 si el empleado está inactivo", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, isActive: false });

    // Act
    const result = await setupTwoFactorAuth(makeReq({}, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(403);
    expect(createLog).toHaveBeenCalled();
  });

  it("retorna 409 si el 2FA ya está configurado (totpSecret existe)", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, totpSecret: "EXISTINGSECRET" });

    // Act
    const result = await setupTwoFactorAuth(makeReq({}, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(409);
  });

  it("retorna QR e imagen si todo es válido", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue(mockEmployee);
    User.saveTempTotpSecret.mockResolvedValue();
    speakeasy.generateSecret.mockReturnValue({
      base32: "SECRETBASE32",
      otpauth_url: "otpauth://totp/RCHQ?secret=SECRETBASE32",
    });
    QRCode.toDataURL.mockResolvedValue("data:image/png;base64,fake");

    // Act
    const result = await setupTwoFactorAuth(makeReq({}, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(200);
    expect(result.body.data).toHaveProperty("qrImage", "data:image/png;base64,fake");
    expect(result.body.nextStep).toBe("VERIFY_2FA_SETUP");
    expect(User.saveTempTotpSecret).toHaveBeenCalledWith("abc-123", "SECRETBASE32");
  });
});

// ─── VERIFY 2FA SETUP ─────────────────────────────────────

describe("verifyTwoFactorSetup", () => {
  it("retorna 401 si no hay employeeId en el token", async () => {
    // Arrange / Act
    const result = await verifyTwoFactorSetup(makeReq({ token: "123456" }, null));

    // Assert
    expect(result.status).toBe(401);
  });

  it("retorna 404 si el empleado no existe", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue(null);

    // Act
    const result = await verifyTwoFactorSetup(makeReq({ token: "123456" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(404);
  });

  it("retorna 409 si no hay setup de 2FA pendiente (sin tempTotpSecret)", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, tempTotpSecret: null });

    // Act
    const result = await verifyTwoFactorSetup(makeReq({ token: "123456" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(409);
  });

  it("retorna 409 si el setup de 2FA expiró", async () => {
    // Arrange
    const createdAt = new Date(Date.now() - 20 * 60 * 1000); // 20 minutos atrás
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      tempTotpSecret: "SECRETBASE32",
      tempTotpSecretCreatedAt: createdAt,
    });
    User.clearTempTotpSecret.mockResolvedValue();

    // Act
    const result = await verifyTwoFactorSetup(makeReq({ token: "123456" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(409);
    expect(User.clearTempTotpSecret).toHaveBeenCalled();
  });

  it("retorna 400 si el token TOTP es inválido", async () => {
    // Arrange
    const createdAt = new Date();
    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      tempTotpSecret: "SECRETBASE32",
      tempTotpSecretCreatedAt: createdAt,
    });
    speakeasy.totp = { verify: jest.fn().mockReturnValue(false) };

    // Act
    const result = await verifyTwoFactorSetup(makeReq({ token: "000000" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(400);
    expect(result.body.nextStep).toBe("2FA_SETUP_FAILED");
  });

  it("activa 2FA correctamente cuando el token es válido", async () => {
    // Arrange
    const createdAt = new Date();
    const prisma = require("../../prisma");
    const mockUpdate = jest.fn().mockResolvedValue({});
    const mockFindUnique = jest.fn().mockResolvedValue({ temp_totp_secret: "SECRETBASE32" });
    prisma.$transaction.mockImplementation((cb) =>
      cb({ employee: { update: mockUpdate, findUnique: mockFindUnique } })
    );

    User.getEmployeeById.mockResolvedValue({
      ...mockEmployee,
      tempTotpSecret: "SECRETBASE32",
      tempTotpSecretCreatedAt: createdAt,
    });
    speakeasy.totp = { verify: jest.fn().mockReturnValue(true) };

    // Act
    const result = await verifyTwoFactorSetup(makeReq({ token: "123456" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(200);
    expect(result.body.nextStep).toBe("2FA_SETUP_COMPLETE");
  });
});

// ─── VALIDATE 2FA AUTH ────────────────────────────────────

describe("validateTwoFactorAuth", () => {
  it("retorna 401 si no hay employeeId en el token", async () => {
    // Arrange / Act
    const result = await validateTwoFactorAuth(makeReq({ token: "123456" }, null));

    // Assert
    expect(result.status).toBe(401);
  });

  it("retorna 404 si el empleado no existe", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue(null);

    // Act
    const result = await validateTwoFactorAuth(makeReq({ token: "123456" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(404);
  });

  it("retorna 409 si el 2FA no está habilitado (sin totpSecret)", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, totpSecret: null });

    // Act
    const result = await validateTwoFactorAuth(makeReq({ token: "123456" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(409);
  });

  it("retorna 423 si el 2FA está bloqueado por intentos fallidos", async () => {
    // Arrange
    const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, totpSecret: "SECRET", twoFaBlockedUntil: blockedUntil });
    isBlockedUntil.mockReturnValue(true);

    // Act
    const result = await validateTwoFactorAuth(makeReq({ token: "000000" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(423);
    expect(result.body.nextStep).toBe("WAIT_2FA_BLOCK");
  });

  it("retorna 401 si el código 2FA es incorrecto", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, totpSecret: "SECRET" });
    speakeasy.totp = { verify: jest.fn().mockReturnValue(false) };
    User.incrementFailed2FAAttempts.mockResolvedValue(1);

    // Act
    const result = await validateTwoFactorAuth(makeReq({ token: "000000" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(401);
    expect(User.incrementFailed2FAAttempts).toHaveBeenCalled();
  });

  it("bloquea el 2FA al llegar a 3 intentos fallidos", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, totpSecret: "SECRET" });
    speakeasy.totp = { verify: jest.fn().mockReturnValue(false) };
    User.incrementFailed2FAAttempts.mockResolvedValue(3);
    User.set2FABlockedUntil.mockResolvedValue();

    // Act
    const result = await validateTwoFactorAuth(makeReq({ token: "000000" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(423);
    expect(User.set2FABlockedUntil).toHaveBeenCalled();
  });

  it("retorna token de sesión cuando el código 2FA es correcto", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, totpSecret: "SECRET" });
    speakeasy.totp = { verify: jest.fn().mockReturnValue(true) };
    User.clear2FASecurityState.mockResolvedValue();

    // Act
    const result = await validateTwoFactorAuth(makeReq({ token: "123456" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("token", "fake-session-token");
    expect(result.body.nextStep).toBe("LOGIN_COMPLETE");
    expect(User.clear2FASecurityState).toHaveBeenCalled();
  });
});

// ─── GET STATUS 2FA ───────────────────────────────────────

describe("getStatus2FA", () => {
  it("retorna 404 si no hay employeeId en el token", async () => {
    // Arrange / Act
    const result = await getStatus2FA(makeReq({}, null));

    // Assert
    expect(result.status).toBe(404);
  });

  it("retorna 404 si el empleado no existe en la BD", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue(null);

    // Act
    const result = await getStatus2FA(makeReq({}, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(404);
  });

  it("retorna 403 si el empleado está inactivo", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, isActive: false });

    // Act
    const result = await getStatus2FA(makeReq({}, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(403);
  });

  it("retorna false cuando el 2FA no está activo", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, isActive2FA: false });

    // Act
    const result = await getStatus2FA(makeReq({}, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(200);
    expect(result.body.Status2FA).toBe(false);
  });

  it("retorna true cuando el 2FA está activo", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, isActive2FA: true, totpSecret: "SECRET" });

    // Act
    const result = await getStatus2FA(makeReq({}, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(200);
    expect(result.body.Status2FA).toBe(true);
  });
});

// ─── DISABLE 2FA ──────────────────────────────────────────

describe("disableTwoFactorAuth", () => {
  it("retorna 401 si no hay employeeId en el token", async () => {
    // Arrange / Act
    const result = await disableTwoFactorAuth(makeReq({ password: "pass" }, null));

    // Assert
    expect(result.status).toBe(401);
  });

  it("retorna 400 si no se envía la contraseña", async () => {
    // Arrange / Act
    const result = await disableTwoFactorAuth(makeReq({}, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(400);
  });

  it("retorna 404 si el empleado no existe", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue(null);

    // Act
    const result = await disableTwoFactorAuth(makeReq({ password: "pass" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(404);
  });

  it("retorna 403 si el empleado está inactivo", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, isActive: false, totpSecret: "SECRET" });

    // Act
    const result = await disableTwoFactorAuth(makeReq({ password: "pass" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(403);
    expect(createLog).toHaveBeenCalled();
  });

  it("retorna 409 si el 2FA no está activo", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, totpSecret: null });

    // Act
    const result = await disableTwoFactorAuth(makeReq({ password: "pass" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(409);
  });

  it("retorna 401 con contraseña incorrecta", async () => {
    // Arrange
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, totpSecret: "SECRET" });
    verifyPassword.mockResolvedValue(false);

    // Act
    const result = await disableTwoFactorAuth(makeReq({ password: "wrong" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(401);
    expect(createLog).toHaveBeenCalled();
  });

  it("desactiva 2FA correctamente y limpia los secrets", async () => {
    // Arrange
    const prisma = require("../../prisma");
    const mockUpdate = jest.fn().mockResolvedValue({});
    prisma.$transaction.mockImplementation((cb) =>
      cb({ employee: { update: mockUpdate } })
    );
    User.getEmployeeById.mockResolvedValue({ ...mockEmployee, totpSecret: "SECRET" });
    verifyPassword.mockResolvedValue(true);

    // Act
    const result = await disableTwoFactorAuth(makeReq({ password: "correct" }, { id: "abc-123" }));

    // Assert
    expect(result.status).toBe(200);
    expect(result.body.nextStep).toBe("2FA_DISABLED");
    expect(result.body.data.twoFactorEnabled).toBe(false);
  });
});
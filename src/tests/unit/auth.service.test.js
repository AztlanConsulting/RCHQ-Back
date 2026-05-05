jest.mock("../../model/auth/auth.model", () => ({
    findEmployeeByEmail: jest.fn(),
    getEmployeeById: jest.fn(),
    incrementFailedAttempts: jest.fn(),
    setBlockedUntil: jest.fn(),
    clearLoginSecurityState: jest.fn(),
    saveTempTotpSecret: jest.fn(),
    clearTempTotpSecret: jest.fn(),
    incrementFailedTwoFactorAuthAttempts: jest.fn(),
    setTwoFactorAuthBlockedUntil: jest.fn(),
    clearTwoFactorAuthSecurityState: jest.fn(),
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
    buildPreTwoFactorAuthJwt: jest.fn(),
}));

jest.mock("../../utils/auth/authGuards", () => ({
    isBlockedUntil: jest.fn(),
    clearExpiredLoginBlock: jest.fn(),
    clearExpiredTwoFactorAuthBlock: jest.fn(),
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

const { verifyPassword } = require("../../utils/password");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
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

const {
    login,
    setupTwoFactorAuth,
    verifyTwoFactorSetup,
    validateTwoFactorAuth,
    getTwoFactorAuthStatus,
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

const auth = require("../../model/auth/auth.model");
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
    isActiveTwoFactorAuth: false,
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
    clearExpiredTwoFactorAuthBlock.mockResolvedValue();
    createLog.mockResolvedValue();
    buildSessionToken.mockReturnValue("fake-session-token");
    buildFirstLoginJwt.mockReturnValue("fake-first-login-token");
    buildPreTwoFactorAuthJwt.mockReturnValue("fake-preTwoFactorAuth-token");
});

describe("login", () => {
    it("retorna 401 si el usuario no existe", async () => {
        auth.findEmployeeByEmail.mockResolvedValue(null);

        const result = await login(
            makeReq({ email: "no@existe.com", password: "pass" }),
        );

        expect(result.status).toBe(401);
        expect(result.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("retorna 401 si el usuario está inactivo", async () => {
        auth.findEmployeeByEmail.mockResolvedValue({
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
        auth.findEmployeeByEmail.mockResolvedValue({
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
        auth.findEmployeeByEmail.mockResolvedValue(mockEmployee);
        verifyPassword.mockResolvedValue(false);
        auth.incrementFailedAttempts.mockResolvedValue(1);

        const result = await login(
            makeReq({ email: "test@gmail.com", password: "wrong" }),
        );

        expect(result.status).toBe(401);
        expect(result.body.code).toBe("INVALID_CREDENTIALS");
        expect(auth.incrementFailedAttempts).toHaveBeenCalledWith(
            mockEmployee.employeeId,
        );
        expect(createLog).toHaveBeenCalled();
    });

    it("bloquea la cuenta y retorna 423 al llegar a 3 intentos fallidos", async () => {
        auth.findEmployeeByEmail.mockResolvedValue(mockEmployee);
        verifyPassword.mockResolvedValue(false);
        auth.incrementFailedAttempts.mockResolvedValue(3);
        auth.setBlockedUntil.mockResolvedValue();

        const result = await login(
            makeReq({ email: "test@gmail.com", password: "wrong" }),
        );

        expect(result.status).toBe(423);
        expect(result.body.code).toBe("ACCOUNT_TEMPORARILY_BLOCKED");
        expect(auth.setBlockedUntil).toHaveBeenCalled();
    });

    it("retorna token de primer login cuando hasFirstLogin es true", async () => {
        auth.findEmployeeByEmail.mockResolvedValue({
            ...mockEmployee,
            hasFirstLogin: true,
        });
        verifyPassword.mockResolvedValue(true);
        auth.clearLoginSecurityState.mockResolvedValue();

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

    it("retorna token de sesión con credenciales válidas y sin TwoFactorAuth activo", async () => {
        auth.findEmployeeByEmail.mockResolvedValue({
            ...mockEmployee,
            hasFirstLogin: false,
            isActiveTwoFactorAuth: false,
        });
        verifyPassword.mockResolvedValue(true);
        auth.clearLoginSecurityState.mockResolvedValue();

        const result = await login(
            makeReq({ email: "test@gmail.com", password: "correct" }),
        );

        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
        expect(result.body.data).toHaveProperty("token", "fake-session-token");
        expect(result.body.isActiveTwoFactorAuth).toBe(false);
        expect(createLog).toHaveBeenCalled();
    });

    it("retorna preTwoFactorAuthToken cuando el usuario tiene TwoFactorAuth activo", async () => {
        auth.findEmployeeByEmail.mockResolvedValue({
            ...mockEmployee,
            hasFirstLogin: false,
            isActiveTwoFactorAuth: true,
        });
        verifyPassword.mockResolvedValue(true);
        auth.clearLoginSecurityState.mockResolvedValue();

        const result = await login(
            makeReq({ email: "test@gmail.com", password: "correct" }),
        );

        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty(
            "preTwoFactorAuthToken",
            "fake-preTwoFactorAuth-token",
        );
        expect(result.body.isActiveTwoFactorAuth).toBe(true);
        expect(result.body.data).toBeUndefined();
    });

    it("limpia el bloqueo expirado antes de verificar la contraseña", async () => {
        auth.findEmployeeByEmail.mockResolvedValue(mockEmployee);
        verifyPassword.mockResolvedValue(true);
        auth.clearLoginSecurityState.mockResolvedValue();

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
        auth.getEmployeeById.mockResolvedValue(null);

        const result = await setupTwoFactorAuth({
            employeeId: "abc-123",
            ipAddress: "127.0.0.1",
        });

        expect(result.status).toBe(404);
    });

    it("retorna 403 si el empleado está inactivo", async () => {
        auth.getEmployeeById.mockResolvedValue({
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

    it("retorna 409 si el TwoFactorAuth ya está configurado (totpSecret existe)", async () => {
        auth.getEmployeeById.mockResolvedValue({
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
        auth.getEmployeeById.mockResolvedValue(mockEmployee);
        auth.saveTempTotpSecret.mockResolvedValue();
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
        expect(result.body.nextStep).toBe("VERIFY_TWO_FACTOR_AUTH_SETUP");
        expect(auth.saveTempTotpSecret).toHaveBeenCalledWith(
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
        auth.getEmployeeById.mockResolvedValue(null);

        const result = await verifyTwoFactorSetup(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(404);
    });

    it("retorna 409 si no hay setup de TwoFactorAuth pendiente (sin tempTotpSecret)", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            tempTotpSecret: null,
        });

        const result = await verifyTwoFactorSetup(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(409);
    });

    it("retorna 409 si el setup de TwoFactorAuth expiró", async () => {
        const createdAt = new Date(Date.now() - 20 * 60 * 1000); // 20 minutos atrás
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            tempTotpSecret: "SECRETBASE32",
            tempTotpSecretCreatedAt: createdAt,
        });
        auth.clearTempTotpSecret.mockResolvedValue();

        const result = await verifyTwoFactorSetup(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(409);
        expect(auth.clearTempTotpSecret).toHaveBeenCalled();
    });

    it("retorna 400 si el token TOTP es inválido", async () => {
        const createdAt = new Date();
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            tempTotpSecret: "SECRETBASE32",
            tempTotpSecretCreatedAt: createdAt,
        });
        speakeasy.totp.verify.mockReturnValue(false);

        const result = await verifyTwoFactorSetup(
            makeReq({ token: "000000" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(400);
        expect(result.body.nextStep).toBe("TWO_FACTOR_AUTH_SETUP_FAILED");
    });

    it("activa TwoFactorAuth correctamente cuando el token es válido", async () => {
        const createdAt = new Date();
        const mockTx = {};
        prisma.$transaction.mockImplementation((cb) => cb(mockTx));
        auth.activateTwoFactorFromTempSecret.mockResolvedValue();

        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            tempTotpSecret: "SECRETBASE32",
            tempTotpSecretCreatedAt: createdAt,
        });
        speakeasy.totp.verify.mockReturnValue(true);

        const result = await verifyTwoFactorSetup(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(auth.activateTwoFactorFromTempSecret).toHaveBeenCalledWith(
            "abc-123",
            mockTx,
        );
        expect(result.status).toBe(200);
        expect(result.body.nextStep).toBe("TWO_FACTOR_AUTH_SETUP_COMPLETE");
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
        auth.getEmployeeById.mockResolvedValue(null);

        const result = await validateTwoFactorAuth(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(404);
    });

    it("retorna 409 si el TwoFactorAuth no está habilitado (sin totpSecret)", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            totpSecret: null,
        });

        const result = await validateTwoFactorAuth(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(409);
    });

    it("retorna 423 si el TwoFactorAuth está bloqueado por intentos fallidos", async () => {
        const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            totpSecret: "SECRET",
            twoFaBlockedUntil: blockedUntil,
        });
        isBlockedUntil.mockReturnValue(true);

        const result = await validateTwoFactorAuth(
            makeReq({ token: "000000" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(423);
        expect(result.body.nextStep).toBe("WAIT_TWO_FACTOR_AUTH_BLOCK");
    });

    it("retorna 401 si el código TwoFactorAuth es incorrecto", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            totpSecret: "SECRET",
        });
        speakeasy.totp.verify.mockReturnValue(false);
        auth.incrementFailedTwoFactorAuthAttempts.mockResolvedValue(1);

        const result = await validateTwoFactorAuth(
            makeReq({ token: "000000" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(401);
        expect(auth.incrementFailedTwoFactorAuthAttempts).toHaveBeenCalled();
    });

    it("bloquea el TwoFactorAuth al llegar a 3 intentos fallidos", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            totpSecret: "SECRET",
        });
        speakeasy.totp.verify.mockReturnValue(false);
        auth.incrementFailedTwoFactorAuthAttempts.mockResolvedValue(3);
        auth.setTwoFactorAuthBlockedUntil.mockResolvedValue();

        const result = await validateTwoFactorAuth(
            makeReq({ token: "000000" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(423);
        expect(auth.setTwoFactorAuthBlockedUntil).toHaveBeenCalled();
    });

    it("retorna token de sesión cuando el código TwoFactorAuth es correcto", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            totpSecret: "SECRET",
        });
        speakeasy.totp.verify.mockReturnValue(true);
        auth.clearTwoFactorAuthSecurityState.mockResolvedValue();

        const result = await validateTwoFactorAuth(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty("token", "fake-session-token");
        expect(result.body.nextStep).toBe("LOGIN_COMPLETE");
        expect(auth.clearTwoFactorAuthSecurityState).toHaveBeenCalled();
    });
});

describe("getTwoFactorAuthStatus", () => {
    it("retorna 404 si no hay employeeId en el token", async () => {
        const result = await getTwoFactorAuthStatus(makeReq({}, null));

        expect(result.status).toBe(404);
    });

    it("retorna 404 si el empleado no existe en la BD", async () => {
        auth.getEmployeeById.mockResolvedValue(null);

        const result = await getTwoFactorAuthStatus(
            makeReq({}, { id: "abc-123" }),
        );

        expect(result.status).toBe(404);
    });

    it("retorna 403 si el empleado está inactivo", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            isActive: false,
        });

        const result = await getTwoFactorAuthStatus(
            makeReq({}, { id: "abc-123" }),
        );

        expect(result.status).toBe(403);
    });

    it("retorna false cuando el TwoFactorAuth no está activo", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            isActiveTwoFactorAuth: false,
        });

        const result = await getTwoFactorAuthStatus(
            makeReq({}, { id: "abc-123" }),
        );

        expect(result.status).toBe(200);
        expect(result.body.StatusTwoFactorAuth).toBe(false);
    });

    it("retorna true cuando el TwoFactorAuth está activo", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            isActiveTwoFactorAuth: true,
            totpSecret: "SECRET",
        });

        const result = await getTwoFactorAuthStatus(
            makeReq({}, { id: "abc-123" }),
        );

        expect(result.status).toBe(200);
        expect(result.body.StatusTwoFactorAuth).toBe(true);
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
        const result = await disableTwoFactorAuth(
            makeReq({}, { id: "abc-123" }),
        );
        expect(result.status).toBe(400);
    });

    it("retorna 404 si el empleado no existe", async () => {
        auth.getEmployeeById.mockResolvedValue(null);

        const result = await disableTwoFactorAuth(
            makeReq({ password: "pass" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(404);
    });

    it("retorna 403 si el empleado está inactivo", async () => {
        auth.getEmployeeById.mockResolvedValue({
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

    it("retorna 409 si el TwoFactorAuth no está activo", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            totpSecret: null,
        });

        const result = await disableTwoFactorAuth(
            makeReq({ password: "pass" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(409);
    });

    it("retorna 401 con contraseña incorrecta", async () => {
        auth.getEmployeeById.mockResolvedValue({
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

    it("desactiva TwoFactorAuth correctamente y limpia los secrets", async () => {
        const mockTx = {};
        prisma.$transaction.mockImplementation((cb) => cb(mockTx));
        auth.disableTwoFactor.mockResolvedValue();

        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            totpSecret: "SECRET",
        });
        verifyPassword.mockResolvedValue(true);

        const result = await disableTwoFactorAuth(
            makeReq({ password: "correct" }, { id: "abc-123" }),
        );

        expect(auth.disableTwoFactor).toHaveBeenCalledWith("abc-123", mockTx);
        expect(result.status).toBe(200);
        expect(result.body.nextStep).toBe("TWO_FACTOR_AUTH_DISABLED");
        expect(result.body.data.twoFactorEnabled).toBe(false);
    });
});

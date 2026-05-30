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
    saveRefreshToken: jest.fn(),
    clearRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
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

jest.mock("../../utils/jwt", () => ({
    generateRefreshToken: jest.fn(),
    decodeToken: jest.fn(),
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
const { generateRefreshToken, decodeToken } = require("../../utils/jwt");

const {
    login,
    setupTwoFactorAuth,
    verifyTwoFactorSetup,
    validateTwoFactorAuth,
    getTwoFactorAuthStatus,
    disableTwoFactorAuth,
    refreshSession,
    logout,
} = require("../../service/auth/auth.service");


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

const mockEmployee = {
    employeeId: "abc-123",
    email: "test@gmail.com",
    name: "Test User",
    role: "Administrador",
    isActive: true,
    hasFirstLogin: false,
    isActiveTwoFactorAuth: false,
    blockedUntil: null,
    twoFaBlockedUntil: null,
    pwd: "hashedPassword",
    totpSecret: null,
    tempTotpSecret: null,
    tempTotpSecretCreatedAt: null,
    refreshToken: null,
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
    generateRefreshToken.mockReturnValue("fake-refresh-token");
    decodeToken.mockReturnValue({ id: "abc-123", tokenType: "REFRESH" });
    auth.saveRefreshToken.mockResolvedValue();
    auth.clearRefreshToken.mockResolvedValue();
    auth.rotateRefreshToken.mockResolvedValue(true);
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
        verifyPassword.mockResolvedValue(true);
        isBlockedUntil.mockReturnValue(true);

        const result = await login(
            makeReq({ email: "test@gmail.com", password: "correct" }),
        );

        expect(result.status).toBe(423);
        expect(result.body.code).toBe("ACCOUNT_TEMPORARILY_BLOCKED");
        expect(result.body).toHaveProperty("blockedUntil");
    });

    it("retorna 401 genérico si la cuenta está bloqueada y la contraseña es incorrecta", async () => {
        const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        auth.findEmployeeByEmail.mockResolvedValue({
            ...mockEmployee,
            blockedUntil,
        });
        verifyPassword.mockResolvedValue(false);
        isBlockedUntil.mockReturnValue(true);

        const result = await login(
            makeReq({ email: "test@gmail.com", password: "wrong" }),
        );

        expect(result.status).toBe(401);
        expect(result.body.code).toBe("INVALID_CREDENTIALS");
        expect(result.body).not.toHaveProperty("blockedUntil");
        expect(auth.incrementFailedAttempts).not.toHaveBeenCalled();
        expect(auth.setBlockedUntil).not.toHaveBeenCalled();
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

    it("bloquea la cuenta y retorna 423 al llegar a 5 intentos fallidos", async () => {
        auth.findEmployeeByEmail.mockResolvedValue(mockEmployee);
        verifyPassword.mockResolvedValue(false);
        auth.incrementFailedAttempts.mockResolvedValue(5);
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

    it("retorna token de sesión con credenciales válidas y sin factor de dos pasos activo", async () => {
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
        expect(result.body.data).toHaveProperty("refreshToken", "fake-refresh-token");
        expect(auth.saveRefreshToken).toHaveBeenCalledWith(mockEmployee.employeeId, "fake-refresh-token");
        expect(result.body.isActiveTwoFactorAuth).toBe(false);
        expect(createLog).toHaveBeenCalled();
        expect(buildSessionToken).toHaveBeenCalledWith(
            expect.objectContaining({ employeeId: mockEmployee.employeeId }),
            expect.any(String),
        );
        expect(generateRefreshToken).toHaveBeenCalledWith(
            expect.objectContaining({ employeeId: mockEmployee.employeeId }),
            expect.any(String),
        );
    });

    it("rechaza el login y conserva la sesion previa si ya hay una sesion activa", async () => {
        auth.findEmployeeByEmail.mockResolvedValue({
            ...mockEmployee,
            refreshToken: "active-refresh-token",
        });
        verifyPassword.mockResolvedValue(true);
        auth.clearLoginSecurityState.mockResolvedValue();

        const result = await login(
            makeReq({ email: "test@gmail.com", password: "correct" }),
        );

        expect(result.status).toBe(409);
        expect(result.body.code).toBe("SESSION_ALREADY_ACTIVE");
        expect(auth.clearRefreshToken).not.toHaveBeenCalled();
        expect(auth.saveRefreshToken).not.toHaveBeenCalled();
        expect(buildSessionToken).not.toHaveBeenCalled();
    });

    it("permite el login si el refresh token previo ya no es valido", async () => {
        auth.findEmployeeByEmail.mockResolvedValue({
            ...mockEmployee,
            refreshToken: "expired-refresh-token",
        });
        verifyPassword.mockResolvedValue(true);
        decodeToken.mockReturnValueOnce(null);
        auth.clearLoginSecurityState.mockResolvedValue();

        const result = await login(
            makeReq({ email: "test@gmail.com", password: "correct" }),
        );

        expect(result.status).toBe(200);
        expect(auth.clearRefreshToken).toHaveBeenCalledWith(
            mockEmployee.employeeId,
        );
        expect(auth.saveRefreshToken).toHaveBeenCalledWith(
            mockEmployee.employeeId,
            "fake-refresh-token",
        );
    });

    it("retorna preTwoFactorAuthToken cuando el usuario tiene factor de dos pasos activo", async () => {
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

    it("retorna 409 si el factor de dos pasos ya está configurado (totpSecret existe)", async () => {
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

    it("retorna 409 si no hay configuración de factor de dos pasos pendiente (sin tempTotpSecret)", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            tempTotpSecret: null,
        });

        const result = await verifyTwoFactorSetup(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(409);
    });

    it("retorna 409 si la configuración de factor de dos pasos expiró", async () => {
        const createdAt = new Date(Date.now() - 20 * 60 * 1000);
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

    it("activa el factor de dos pasos correctamente cuando el token es válido", async () => {
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

    it("retorna 409 si el factor de dos pasos no está habilitado (sin totpSecret)", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            totpSecret: null,
        });

        const result = await validateTwoFactorAuth(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(409);
    });

    it("retorna 423 si el factor de dos pasos está bloqueado por intentos fallidos", async () => {
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

    it("retorna 401 si el código del factor de dos pasos es incorrecto", async () => {
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

    it("bloquea el factor de dos pasos al llegar a 3 intentos fallidos", async () => {
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

    it("retorna token de sesión cuando el código del factor de dos pasos es correcto", async () => {
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
        expect(result.body.data).toHaveProperty("token", "fake-session-token");
        expect(result.body.data).toHaveProperty("refreshToken", "fake-refresh-token");
        expect(result.body.nextStep).toBe("LOGIN_COMPLETE");
        expect(auth.saveRefreshToken).toHaveBeenCalledWith(mockEmployee.employeeId, "fake-refresh-token");
        expect(auth.clearTwoFactorAuthSecurityState).toHaveBeenCalled();
        expect(buildSessionToken).toHaveBeenCalledWith(
            expect.objectContaining({ employeeId: mockEmployee.employeeId }),
            expect.any(String),
        );
        expect(generateRefreshToken).toHaveBeenCalledWith(
            expect.objectContaining({ employeeId: mockEmployee.employeeId }),
            expect.any(String),
        );
    });

    it("rechaza el 2FA y conserva la sesion previa si ya hay una sesion activa", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            totpSecret: "SECRET",
            refreshToken: "active-refresh-token",
        });
        speakeasy.totp.verify.mockReturnValue(true);
        auth.clearTwoFactorAuthSecurityState.mockResolvedValue();

        const result = await validateTwoFactorAuth(
            makeReq({ token: "123456" }, { id: "abc-123" }),
        );

        expect(result.status).toBe(409);
        expect(result.body.code).toBe("SESSION_ALREADY_ACTIVE");
        expect(auth.clearRefreshToken).not.toHaveBeenCalled();
        expect(auth.saveRefreshToken).not.toHaveBeenCalled();
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

    it("retorna false cuando el factor de dos pasos no está activo", async () => {
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

    it("retorna true cuando el factor de dos pasos está activo", async () => {
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

    it("retorna 409 si el factor de dos pasos no está activo", async () => {
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

    it("desactiva el factor de dos pasos correctamente y limpia los secrets", async () => {
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

describe("refreshSession", () => {
    it("retorna 401 si no se proporciona token", async () => {
        const result = await refreshSession(null, "127.0.0.1");
        expect(result.status).toBe(401);
        expect(result.body.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("retorna 401 si el token no es válido o expira", async () => {
        decodeToken.mockReturnValue(null);
        const result = await refreshSession("bad-token", "127.0.0.1");
        expect(result.status).toBe(401);
    });

    it("retorna 403 si el empleado no existe o está inactivo", async () => {
        auth.getEmployeeById.mockResolvedValue(null);
        const result = await refreshSession("valid-token", "127.0.0.1");
        expect(result.status).toBe(403);
    });

    it("retorna 401 y limpia token si el token no coincide con BD (prevención de reuso)", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            refreshToken: "different-token",
        });
        const result = await refreshSession("old-token", "127.0.0.1");
        expect(result.status).toBe(401);
        expect(auth.clearRefreshToken).toHaveBeenCalledWith("abc-123");
    });

    it("retorna 200 y nuevos tokens si la sesión es válida", async () => {
        auth.getEmployeeById.mockResolvedValue({
            ...mockEmployee,
            refreshToken: "valid-token",
        });
        decodeToken.mockReturnValue({
            id: "abc-123",
            tokenType: "REFRESH",
            sessionId: "session-123",
        });
        const result = await refreshSession("valid-token", "127.0.0.1");
        
        expect(result.status).toBe(200);
        expect(result.body.data).toHaveProperty("token", "fake-session-token");
        expect(result.body.data).toHaveProperty("refreshToken", "valid-token");
        expect(auth.rotateRefreshToken).not.toHaveBeenCalled();
        expect(buildSessionToken).toHaveBeenCalledWith(
            expect.objectContaining({ employeeId: mockEmployee.employeeId }),
            "session-123",
        );
    });
});

describe("logout", () => {
    it("retorna 200 y no falla si no se envía token", async () => {
        const result = await logout(null);
        expect(result.status).toBe(200);
        expect(auth.clearRefreshToken).not.toHaveBeenCalled();
    });

    it("retorna 200 y limpia el token en BD si es válido", async () => {
        decodeToken.mockReturnValue({ id: "abc-123" });
        const result = await logout("valid-token");
        expect(result.status).toBe(200);
        expect(auth.clearRefreshToken).toHaveBeenCalledWith("abc-123");
    });
});

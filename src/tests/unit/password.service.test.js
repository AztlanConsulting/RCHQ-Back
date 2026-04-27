jest.mock("../../prisma", () => ({
    $transaction: jest.fn(),
}));

jest.mock("../../model/user.model", () => ({
    getEmployeeById: jest.fn(),
    updatePassword: jest.fn(),
    updatePasswordAndClearFirstLogin: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
    createLog: jest.fn(),
}));

jest.mock("../../utils/password", () => ({
    verifyPassword: jest.fn(),
    hashPassword: jest.fn(),
}));

jest.mock("../../utils/auth/authTokens", () => ({
    buildSessionToken: jest.fn(),
    buildPre2faJwt: jest.fn(),
}));

const prisma = require("../../prisma");
const User = require("../../model/user.model");
const { createLog } = require("../../model/log.model");
const { verifyPassword, hashPassword } = require("../../utils/password");
const {
    buildSessionToken,
    buildPre2faJwt,
} = require("../../utils/auth/authTokens");

const {
    changePassword,
    changePasswordFirstLogin,
} = require("../../service/password.service");

const mockEmployee = {
    employeeId: "emp-123",
    email: "andre@gmail.com",
    name: "Carlos",
    role: "admin",
    isActive: true,
    hasFirstLogin: true,
    isActive2FA: false,
    pwd: "hashed-password",
};

describe("password.service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        createLog.mockResolvedValue();
        hashPassword.mockResolvedValue("new-hashed-password");
        buildSessionToken.mockReturnValue("fake-session-token");
        buildPre2faJwt.mockReturnValue("fake-pre2fa-token");
    });

    describe("changePassword", () => {
        it("retorna 401 si no hay usuario autenticado", async () => {
            const result = await changePassword({
                currentPassword: "Actual123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(result.status).toBe(401);
            expect(result.body.success).toBe(false);
            expect(result.body.message).toBe("Usuario no autenticado");
        });

        it("retorna 404 si el empleado no existe", async () => {
            User.getEmployeeById.mockResolvedValue(null);

            const result = await changePassword({
                employeeId: "emp-123",
                currentPassword: "Actual123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(User.getEmployeeById).toHaveBeenCalledWith("emp-123");
            expect(result.status).toBe(404);
            expect(result.body.message).toBe("Empleado no encontrado");
        });

        it("retorna 403 si el usuario está inactivo", async () => {
            User.getEmployeeById.mockResolvedValue({
                ...mockEmployee,
                isActive: false,
            });

            const result = await changePassword({
                employeeId: "emp-123",
                currentPassword: "Actual123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(createLog).toHaveBeenCalled();
            expect(result.status).toBe(403);
            expect(result.body.message).toBe("Acceso no permitido");
        });

        it("retorna 401 si la contraseña actual es incorrecta", async () => {
            User.getEmployeeById.mockResolvedValue({
                ...mockEmployee,
                hasFirstLogin: false,
            });

            verifyPassword.mockResolvedValueOnce(false);

            const result = await changePassword({
                employeeId: "emp-123",
                currentPassword: "Incorrecta123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(verifyPassword).toHaveBeenCalledWith(
                "Incorrecta123",
                "hashed-password",
            );
            expect(createLog).toHaveBeenCalled();
            expect(result.status).toBe(401);
            expect(result.body.message).toBe("Credenciales inválidas");
        });

        it("retorna 400 si la nueva contraseña es igual a la actual", async () => {
            User.getEmployeeById.mockResolvedValue({
                ...mockEmployee,
                hasFirstLogin: false,
            });

            verifyPassword
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true);

            const result = await changePassword({
                employeeId: "emp-123",
                currentPassword: "Actual123",
                newPassword: "Actual123",
                ipAddress: "127.0.0.1",
            });

            expect(result.status).toBe(400);
            expect(result.body.message).toBe(
                "La nueva contraseña debe ser diferente a la actual",
            );
        });

        it("cambia la contraseña correctamente", async () => {
            User.getEmployeeById.mockResolvedValue({
                ...mockEmployee,
                hasFirstLogin: false,
            });

            verifyPassword
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false);

            const mockTx = {};

            prisma.$transaction.mockImplementation(async (cb) => cb(mockTx));

            const result = await changePassword({
                employeeId: "emp-123",
                currentPassword: "Actual123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(hashPassword).toHaveBeenCalledWith("Nueva123A");
            expect(User.updatePassword).toHaveBeenCalledWith(
                "emp-123",
                "new-hashed-password",
                mockTx,
            );
            expect(createLog).toHaveBeenCalled();
            expect(result.status).toBe(200);
            expect(result.body.success).toBe(true);
        });
    });

    describe("changePasswordFirstLogin", () => {
        it("retorna 401 si no hay usuario autenticado", async () => {
            const result = await changePasswordFirstLogin({
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(result.status).toBe(401);
            expect(result.body.message).toBe("Usuario no autenticado");
        });

        it("retorna 404 si el empleado no existe", async () => {
            User.getEmployeeById.mockResolvedValue(null);

            const result = await changePasswordFirstLogin({
                employeeId: "emp-123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(result.status).toBe(404);
            expect(result.body.message).toBe("Empleado no encontrado");
        });

        it("retorna 403 si el usuario está inactivo", async () => {
            User.getEmployeeById.mockResolvedValue({
                ...mockEmployee,
                isActive: false,
            });

            const result = await changePasswordFirstLogin({
                employeeId: "emp-123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(createLog).toHaveBeenCalled();
            expect(result.status).toBe(403);
            expect(result.body.message).toBe("Acceso no permitido");
        });

        it("retorna 409 si ya no requiere cambio de primer login", async () => {
            User.getEmployeeById.mockResolvedValue({
                ...mockEmployee,
                hasFirstLogin: false,
            });

            const result = await changePasswordFirstLogin({
                employeeId: "emp-123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(result.status).toBe(409);
            expect(result.body.message).toBe(
                "Cambio de contraseña en primer inicio de sesión ya completado",
            );
        });

        it("retorna 400 si la nueva contraseña es igual a la actual", async () => {
            User.getEmployeeById.mockResolvedValue(mockEmployee);
            verifyPassword.mockResolvedValueOnce(true);

            const result = await changePasswordFirstLogin({
                employeeId: "emp-123",
                newPassword: "Actual123",
                ipAddress: "127.0.0.1",
            });

            expect(result.status).toBe(400);
            expect(result.body.message).toBe(
                "La nueva contraseña debe ser diferente a la actual",
            );
        });

        it("completa el primer login y retorna token de sesión", async () => {
            User.getEmployeeById.mockResolvedValue(mockEmployee);
            verifyPassword.mockResolvedValueOnce(false);

            const mockTx = {
                employee: {
                    update: jest.fn().mockResolvedValue({}),
                },
            };

            prisma.$transaction.mockImplementation(async (cb) => cb(mockTx));

            const result = await changePasswordFirstLogin({
                employeeId: "emp-123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(hashPassword).toHaveBeenCalledWith("Nueva123A");
            expect(User.updatePasswordAndClearFirstLogin).toHaveBeenCalledWith(
                "emp-123",
                "new-hashed-password",
                mockTx,
            );
            expect(createLog).toHaveBeenCalledTimes(2);
            expect(buildSessionToken).toHaveBeenCalled();
            expect(result.status).toBe(200);
            expect(result.body.nextStep).toBe("LOGIN_COMPLETE");
            expect(result.body.data.token).toBe("fake-session-token");
        });

        it("retorna pre2FAToken si el usuario tiene 2FA activo", async () => {
            User.getEmployeeById.mockResolvedValue({
                ...mockEmployee,
                isActive2FA: true,
            });
            verifyPassword.mockResolvedValueOnce(false);

            const mockTx = {
                employee: {
                    update: jest.fn().mockResolvedValue({}),
                },
            };

            prisma.$transaction.mockImplementation(async (cb) => cb(mockTx));

            const result = await changePasswordFirstLogin({
                employeeId: "emp-123",
                newPassword: "Nueva123A",
                ipAddress: "127.0.0.1",
            });

            expect(result.status).toBe(200);
            expect(result.body.nextStep).toBe("VERIFY_2FA");
            expect(result.body.data.pre2FAToken).toBe("fake-pre2fa-token");
            expect(buildPre2faJwt).toHaveBeenCalled();
        });
    });
});
const { login } = require("../../service/auth.service");

// Mockear todos los módulos externos
jest.mock("../../model/user.model");
jest.mock("../../utils/password");
jest.mock("../../model/log.model");
jest.mock("../../utils/ip");
jest.mock("../../utils/auth/authTokens");
jest.mock("../../utils/auth/authGuards");

const User = require("../../model/user.model");
const { verifyPassword } = require("../../utils/password");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");
const { buildSessionToken } = require("../../utils/auth/authTokens");
const { isBlockedUntil, clearExpiredLoginBlock } = require("../../utils/auth/authGuards");

describe("Auth Service", () => {
  const mockEmployee = {
    employeeId: "abc-123",
    email: "andre@gmail.com",
    name: "Andre",
    role: "admin",
    isActive: true,
    blockedUntil: null,
    pwd: "hashedPassword",
  };

  // Resetear mocks entre tests
  beforeEach(() => {
    jest.clearAllMocks();
    getClientIp.mockReturnValue("127.0.0.1");
    isBlockedUntil.mockReturnValue(false);
    clearExpiredLoginBlock.mockResolvedValue();
    createLog.mockResolvedValue();
    buildSessionToken.mockReturnValue("fake-jwt-token");
  });

  const makeReq = (email, password) => ({
    body: { email, password },
    ip: "127.0.0.1",
  });

  describe("login", () => {
    it("debería retornar token con credenciales válidas", async () => {
      User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
      verifyPassword.mockResolvedValue(true);
      User.clearLoginSecurityState.mockResolvedValue();

      const result = await login(makeReq("Andre@gmail.com", "Andatti67"));

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe("Login successful");
      expect(result.body.data).toHaveProperty("token", "fake-jwt-token");
      expect(result.body.data.user.email).toBe("andre@gmail.com");
    });

    it("debería retornar 401 con contraseña incorrecta", async () => {
      User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
      verifyPassword.mockResolvedValue(false);
      User.incrementFailedAttempts.mockResolvedValue(1);

      const result = await login(makeReq("Andre@gmail.com", "WrongPassword"));

      expect(result.status).toBe(401);
      expect(result.body.success).toBe(false);
      expect(result.body).not.toHaveProperty("token");
    });

    it("debería retornar 401 si el usuario no existe", async () => {
      User.findEmployeeByEmail.mockResolvedValue(null);

      const result = await login(makeReq("noexiste@gmail.com", "password"));

      expect(result.status).toBe(401);
      expect(result.body.success).toBe(false);
    });

    it("debería retornar 401 si el usuario está inactivo", async () => {
      User.findEmployeeByEmail.mockResolvedValue({ ...mockEmployee, isActive: false });

      const result = await login(makeReq("Andre@gmail.com", "Andatti67"));

      expect(result.status).toBe(401);
    });

    it("debería retornar 423 si la cuenta está bloqueada", async () => {
      const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      User.findEmployeeByEmail.mockResolvedValue({ ...mockEmployee, blockedUntil });
      isBlockedUntil.mockReturnValue(true);

      const result = await login(makeReq("Andre@gmail.com", "Andatti67"));

      expect(result.status).toBe(423);
      expect(result.body.message).toBe("Account temporarily blocked");
    });

    it("debería bloquear la cuenta al llegar a 3 intentos fallidos", async () => {
      User.findEmployeeByEmail.mockResolvedValue(mockEmployee);
      verifyPassword.mockResolvedValue(false);
      User.incrementFailedAttempts.mockResolvedValue(3); // ← tercer intento
      User.setBlockedUntil.mockResolvedValue();

      const result = await login(makeReq("Andre@gmail.com", "WrongPassword"));

      expect(result.status).toBe(423);
      expect(User.setBlockedUntil).toHaveBeenCalled();
    });
  });
});
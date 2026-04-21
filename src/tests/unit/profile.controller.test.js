// tests/backend/profile.controller.test.js
const { getUserProfile: controllerFn } = require("../../controller/profile.controller");

jest.mock("../../service/profile.service");
const profileService = require("../../service/profile.service");

// ─── Helpers ─────────────────────────────────────────────────────────────────
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const MOCK_PROFILE_BODY = {
  success: true,
  data: {
    houseName: "Casa Hogar Querétaro",
    roleName:  "Coordinador",
    name:      "Juan",
    surname:   "Pérez",
    email:     "juan@casa.org",
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("profile.controller — getUserProfile", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { id: "uuid-empleado-001" } };
    res = buildRes();
  });

  describe("Flujo exitoso — 200", () => {
    it("responde 200 con el body del service", async () => {
      profileService.getUserProfile.mockResolvedValue({
        status: 200,
        body:   MOCK_PROFILE_BODY,
      });

      await controllerFn(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(MOCK_PROFILE_BODY);
    });
  });

  describe("Flujo - perfil no encontrado — 404", () => {
    it("responde 404 con mensaje de error del service", async () => {
      profileService.getUserProfile.mockResolvedValue({
        status: 404,
        body:   { success: false, message: "Perfil no encontrado" },
      });

      await controllerFn(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Perfil no encontrado",
      });
    });
  });

  describe("Flujo - error inesperado — 500", () => {
    it("responde 500 cuando el service lanza una excepción", async () => {
      profileService.getUserProfile.mockRejectedValue(new Error("Unexpected"));

      await controllerFn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error al obtener el perfil del usuario",
      });
    });

    it("no propaga el error al caller (catch interno)", async () => {
      profileService.getUserProfile.mockRejectedValue(new Error("boom"));

      await expect(controllerFn(req, res)).resolves.not.toThrow();
    });
  });
});
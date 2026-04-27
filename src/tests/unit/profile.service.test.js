// tests/backend/profile.service.test.js
const { getUserProfile } = require("../../service/profile.service");

jest.mock("../../model/profile.model");
const profileModel = require("../../model/profile.model");

// ─── Fixtures ────────────────────────────────────────────────────────────────
const EMPLOYEE_ID = "uuid-empleado-001";

const MOCK_PROFILE = {
  houseName:   "Casa Hogar Querétaro",
  roleName:    "Coordinador",
  name:        "Juan",
  surname:     "Pérez",
  email:       "juan@casa.org",
  rfc:         "PERJ900101ABC",
  curp:        "PERJ900101HDFRZN01",
  nss:         "12345678901",
  bankAccount: "012345678901234567",
  birthDate:   new Date("1990-01-01"),
  picture:     "https://cdn.example.com/foto.jpg",
};

const buildReq = (id = EMPLOYEE_ID) => ({ user: { id } });

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("profile.service — getUserProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Flujo exitoso — 200", () => {
    it("retorna status 200 y los datos del perfil", async () => {
      profileModel.findEmployeeProfile.mockResolvedValue(MOCK_PROFILE);

      const result = await getUserProfile(buildReq());

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toEqual(MOCK_PROFILE);
    });

    it("llama al model con el id extraído de req.user", async () => {
      profileModel.findEmployeeProfile.mockResolvedValue(MOCK_PROFILE);

      await getUserProfile(buildReq("otro-uuid"));

      expect(profileModel.findEmployeeProfile).toHaveBeenCalledWith("otro-uuid");
    });
  });

  describe("Flujo - empleado no encontrado — 404", () => {
    it("retorna status 404 cuando el model devuelve null", async () => {
      profileModel.findEmployeeProfile.mockResolvedValue(null);

      const result = await getUserProfile(buildReq());

      expect(result.status).toBe(404);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toBe("Perfil no encontrado");
    });
  });

  describe("Flujo - error del model", () => {
    it("propaga el error para que el controller lo capture", async () => {
      profileModel.findEmployeeProfile.mockRejectedValue(new Error("DB error"));

      await expect(getUserProfile(buildReq())).rejects.toThrow("DB error");
    });
  });
});
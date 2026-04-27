// tests/backend/profile.model.test.js
const { findEmployeeProfile } = require("../../model/user/profile.model");

// Mock de Prisma
jest.mock("../../prisma", () => ({
  employee: {
    findUnique: jest.fn(),
  },
}));

const prisma = require("../../prisma");

// ─── Fixture ────────────────────────────────────────────────────────────────
const EMPLOYEE_ID = "uuid-empleado-001";

const DB_ROW = {
  name:         "Juan",
  surname:      "Pérez",
  email:        "juan@casa.org",
  rfc:          "PERJ900101ABC",
  curp:         "PERJ900101HDFRZN01",
  nss:          "12345678901",
  bank_account: "012345678901234567",
  birth_date:   new Date("1990-01-01"),
  picture:      "https://cdn.example.com/foto.jpg",
  house:        { name: "Casa Hogar Querétaro" },
  role:         { name: "Coordinador" },
};

const MAPPED = {
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

// ─── Tests ──────────────────────────────────────────────────────────────────
describe("profile.model — findEmployeeProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Flujo exitoso", () => {
    it("llama a prisma.employee.findUnique con los parámetros correctos", async () => {
      prisma.employee.findUnique.mockResolvedValue(DB_ROW);

      await findEmployeeProfile(EMPLOYEE_ID);

      expect(prisma.employee.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { employee_id: EMPLOYEE_ID },
        select: expect.objectContaining({
          house: { select: { name: true } },
          role:  { select: { name: true } },
        }),
      });
    });

    it("retorna el perfil mapeado correctamente", async () => {
      prisma.employee.findUnique.mockResolvedValue(DB_ROW);

      const result = await findEmployeeProfile(EMPLOYEE_ID);

      expect(result).toEqual(MAPPED);
    });

    it("mapea houseName y roleName desde las relaciones anidadas", async () => {
      prisma.employee.findUnique.mockResolvedValue(DB_ROW);

      const result = await findEmployeeProfile(EMPLOYEE_ID);

      expect(result.houseName).toBe("Casa Hogar Querétaro");
      expect(result.roleName).toBe("Coordinador");
    });

    it("maneja campos opcionales nulos sin romper el mapeo", async () => {
      prisma.employee.findUnique.mockResolvedValue({
        ...DB_ROW,
        rfc:          null,
        nss:          null,
        bank_account: null,
        birth_date:   null,
        picture:      null,
      });

      const result = await findEmployeeProfile(EMPLOYEE_ID);

      expect(result.rfc).toBeNull();
      expect(result.nss).toBeNull();
      expect(result.bankAccount).toBeNull();
      expect(result.birthDate).toBeNull();
      expect(result.picture).toBeNull();
    });
  });

  describe("Flujo - empleado no encontrado", () => {
    it("retorna null cuando prisma no encuentra el empleado", async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      const result = await findEmployeeProfile(EMPLOYEE_ID);

      expect(result).toBeNull();
    });
  });

  describe("Flujo - error de base de datos", () => {
    it("propaga el error cuando prisma lanza una excepción", async () => {
      prisma.employee.findUnique.mockRejectedValue(new Error("DB connection lost"));

      await expect(findEmployeeProfile(EMPLOYEE_ID)).rejects.toThrow("DB connection lost");
    });
  });
});
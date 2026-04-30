// src/tests/unit/deactivate.model.test.js
const {
  getEmployeeToDeactivate,
  deactivateEmployee,
  insertIntoBlacklist,
} = require("../../model/employee/deactivate.model");

jest.mock("../../prisma", () => ({
  employee: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  blacklist: {
    create: jest.fn(),
  },
}));

const prisma = require("../../prisma");

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const EMPLOYEE_ID = "uuid-empleado-001";

const DB_ROW = {
  employee_id: EMPLOYEE_ID,
  name: "Carlos",
  surname: "Ramírez",
  house_id: "uuid-house-001",
  curp: "RAMC900101HDFRZN01",
  is_active: true,
};

const MAPPED = {
  employeeId: EMPLOYEE_ID,
  name: "Carlos",
  surname: "Ramírez",
  houseId: "uuid-house-001",
  curp: "RAMC900101HDFRZN01",
  isActive: true,
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("deactivate.model", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getEmployeeToDeactivate ────────────────────────────────────────────────
  describe("getEmployeeToDeactivate", () => {
    describe("Flujo exitoso", () => {
      it("llama a prisma.employee.findUnique con los parámetros correctos", async () => {
        prisma.employee.findUnique.mockResolvedValue(DB_ROW);

        await getEmployeeToDeactivate(EMPLOYEE_ID);

        expect(prisma.employee.findUnique).toHaveBeenCalledWith({
          where: { employee_id: EMPLOYEE_ID },
          select: expect.objectContaining({
            employee_id: true,
            name: true,
            surname: true,
            house_id: true,
            curp: true,
            is_active: true,
          }),
        });
      });

      it("retorna el empleado mapeado correctamente", async () => {
        prisma.employee.findUnique.mockResolvedValue(DB_ROW);

        const result = await getEmployeeToDeactivate(EMPLOYEE_ID);

        expect(result).toEqual(MAPPED);
      });

      it("mapea is_active a isActive y house_id a houseId", async () => {
        prisma.employee.findUnique.mockResolvedValue(DB_ROW);

        const result = await getEmployeeToDeactivate(EMPLOYEE_ID);

        expect(result.isActive).toBe(true);
        expect(result.houseId).toBe("uuid-house-001");
        expect(result).not.toHaveProperty("is_active");
        expect(result).not.toHaveProperty("house_id");
      });

      it("retorna el empleado aunque isActive sea false", async () => {
        prisma.employee.findUnique.mockResolvedValue({
          ...DB_ROW,
          is_active: false,
        });

        const result = await getEmployeeToDeactivate(EMPLOYEE_ID);

        expect(result.isActive).toBe(false);
      });
    });

    describe("Flujo — empleado no encontrado", () => {
      it("retorna null cuando prisma no encuentra el empleado", async () => {
        prisma.employee.findUnique.mockResolvedValue(null);

        const result = await getEmployeeToDeactivate(EMPLOYEE_ID);

        expect(result).toBeNull();
      });
    });

    describe("Flujo — error de base de datos", () => {
      it("propaga el error cuando prisma lanza una excepción", async () => {
        prisma.employee.findUnique.mockRejectedValue(
          new Error("DB connection lost"),
        );

        await expect(getEmployeeToDeactivate(EMPLOYEE_ID)).rejects.toThrow(
          "DB connection lost",
        );
      });
    });
  });

  // ── deactivateEmployee ─────────────────────────────────────────────────────
  describe("deactivateEmployee", () => {
    describe("Flujo exitoso", () => {
      it("llama a prisma.employee.update con is_active false y end_date", async () => {
        prisma.employee.update.mockResolvedValue(undefined);

        await deactivateEmployee(EMPLOYEE_ID);

        expect(prisma.employee.update).toHaveBeenCalledWith({
          where: { employee_id: EMPLOYEE_ID },
          data: expect.objectContaining({
            is_active: false,
            end_date: expect.any(Date),
          }),
        });
      });

      it("no retorna valor (void)", async () => {
        prisma.employee.update.mockResolvedValue(undefined);

        const result = await deactivateEmployee(EMPLOYEE_ID);

        expect(result).toBeUndefined();
      });
    });

    describe("Flujo — error de base de datos", () => {
      it("propaga el error cuando prisma lanza una excepción", async () => {
        prisma.employee.update.mockRejectedValue(new Error("Update failed"));

        await expect(deactivateEmployee(EMPLOYEE_ID)).rejects.toThrow(
          "Update failed",
        );
      });
    });
  });

  // ── insertIntoBlacklist ────────────────────────────────────────────────────
  describe("insertIntoBlacklist", () => {
    const CURP = "RAMC900101HDFRZN01";
    const NAME = "Carlos";
    const SURNAME = "Ramírez";
    const REASON = "Conducta inapropiada";

    describe("Flujo exitoso", () => {
      it("llama a prisma.blacklist.create con los datos correctos", async () => {
        prisma.blacklist.create.mockResolvedValue(undefined);

        await insertIntoBlacklist(CURP, NAME, SURNAME, REASON);

        expect(prisma.blacklist.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            curp: CURP,
            name: NAME,
            surname: SURNAME,
            reason: REASON,
            blacklist_id: expect.any(String),
            created_at: expect.any(Date),
          }),
        });
      });

      it("genera un UUID único para blacklist_id", async () => {
        prisma.blacklist.create.mockResolvedValue(undefined);

        await insertIntoBlacklist(CURP, NAME, SURNAME, REASON);
        await insertIntoBlacklist(CURP, NAME, SURNAME, REASON);

        const firstCall = prisma.blacklist.create.mock.calls[0][0].data.blacklist_id;
        const secondCall = prisma.blacklist.create.mock.calls[1][0].data.blacklist_id;

        expect(firstCall).not.toBe(secondCall);
      });

      it("no retorna valor (void)", async () => {
        prisma.blacklist.create.mockResolvedValue(undefined);

        const result = await insertIntoBlacklist(CURP, NAME, SURNAME, REASON);

        expect(result).toBeUndefined();
      });
    });

    describe("Flujo — error de base de datos", () => {
      it("propaga el error cuando prisma lanza una excepción", async () => {
        prisma.blacklist.create.mockRejectedValue(
          new Error("Blacklist insert failed"),
        );

        await expect(
          insertIntoBlacklist(CURP, NAME, SURNAME, REASON),
        ).rejects.toThrow("Blacklist insert failed");
      });
    });
  });
});
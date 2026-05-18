const {
    getEmployeeToDeactivate,
    deactivateEmployee,
} = require("../../model/employee/deactivate.model");

jest.mock("../../prisma", () => ({
    employee: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    blacklist: {
        upsert: jest.fn(),
    },
    $transaction: jest.fn(),
}));

const prisma = require("../../prisma");

const EMPLOYEE_ID = "uuid-empleado-001";

const DB_ROW = {
    employee_id: EMPLOYEE_ID,
    name: "Carlos",
    surname: "Ramírez",
    house_id: "uuid-house-001",
    curp: "RAMC900101HDFRZN01",
    is_active: true,
    blacklist: null,
};

const MAPPED = {
    employeeId: EMPLOYEE_ID,
    name: "Carlos",
    surname: "Ramírez",
    houseId: "uuid-house-001",
    curp: "RAMC900101HDFRZN01",
    isActive: true,
    isBlacklisted: false,
};

describe("deactivate.model", () => {
    beforeEach(() => jest.clearAllMocks());

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
                        blacklist: true,
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

            it("retorna isBlacklisted true si el empleado tiene blacklist", async () => {
                prisma.employee.findUnique.mockResolvedValue({
                    ...DB_ROW,
                    blacklist: { curp: "RAMC900101HDFRZN01" },
                });
                const result = await getEmployeeToDeactivate(EMPLOYEE_ID);
                expect(result.isBlacklisted).toBe(true);
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
                await expect(
                    getEmployeeToDeactivate(EMPLOYEE_ID),
                ).rejects.toThrow("DB connection lost");
            });
        });
    });

    describe("deactivateEmployee", () => {
        describe("Flujo exitoso", () => {
            it("ejecuta una transacción con prisma.employee.update si wasActive es true", async () => {
                prisma.employee.update.mockReturnValue("update_action");
                prisma.$transaction.mockResolvedValue(undefined);
                await deactivateEmployee(EMPLOYEE_ID, "Motivo de prueba");
                
                expect(prisma.$transaction).toHaveBeenCalledWith(["update_action"]);
                expect(prisma.employee.update).toHaveBeenCalledWith(expect.objectContaining({
                    where: { employee_id: EMPLOYEE_ID },
                }));
            });

            it("ejecuta blacklist.upsert si curpToBlacklist es provisto", async () => {
                prisma.employee.update.mockReturnValue("update_action");
                prisma.blacklist.upsert.mockReturnValue("upsert_action");
                prisma.$transaction.mockResolvedValue(undefined);
                
                await deactivateEmployee(EMPLOYEE_ID, "Motivo", "RAMC900101HDFRZN01", true);
                
                expect(prisma.$transaction).toHaveBeenCalledWith(["update_action", "upsert_action"]);
                expect(prisma.blacklist.upsert).toHaveBeenCalledWith(expect.objectContaining({
                    where: { curp: "RAMC900101HDFRZN01" }
                }));
            });

            it("no añade employee.update si wasActive es false", async () => {
                prisma.blacklist.upsert.mockReturnValue("upsert_action");
                prisma.$transaction.mockResolvedValue(undefined);
                await deactivateEmployee(EMPLOYEE_ID, "Motivo", "RAMC900101HDFRZN01", false);
                expect(prisma.employee.update).not.toHaveBeenCalled();
                expect(prisma.$transaction).toHaveBeenCalledWith(["upsert_action"]);
            });

            it("no retorna valor (void)", async () => {
                prisma.employee.update.mockResolvedValue(undefined);
                const result = await deactivateEmployee(EMPLOYEE_ID);
                expect(result).toBeUndefined();
            });
        });

        describe("Flujo — error de base de datos", () => {
            it("propaga el error cuando prisma lanza una excepción", async () => {
                prisma.$transaction.mockRejectedValue(
                    new Error("Update failed"),
                );
                await expect(deactivateEmployee(EMPLOYEE_ID)).rejects.toThrow(
                    "Update failed",
                );
            });
        });
    });
});

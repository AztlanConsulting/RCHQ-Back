jest.mock("../../model/blacklist/get.model", () => ({
    findEmployeeById: jest.fn(),
}));

// Mockeamos la nueva función transaccional en lugar de las funciones separadas
jest.mock("../../model/blacklist/patch.model", () => ({
    transactionalBlacklistInsert: jest.fn(),
}));

const { findEmployeeById } = require("../../model/blacklist/get.model");
const { transactionalBlacklistInsert } = require("../../model/blacklist/patch.model");
const { insertIntoBlacklist } = require("../../service/blacklist/create.service");
const RESPONSES = require("../../utils/responses");

// ─── Fixtures ─────────────────────────────────────────────

const mockEmployee = {
    employeeId: "e0000002-0000-4000-8000-000000000002",
    name: "Luis",
    surname: "Pérez",
    curp: "PELM900101HDFRZS09",
    isActive: true,
};

const mockBlacklistEntry = {
    blacklistId: "b0000001-0000-4000-8000-000000000001",
    employeeId: mockEmployee.employeeId,
    curp: mockEmployee.curp,
    createdAt: new Date("2026-01-01T00:00:00Z"),
};

// ─── Hooks ────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────

describe("insertIntoBlacklist", () => {
    it("retorna EMPLOYEE_NOT_FOUND si el empleado no existe", async () => {
        findEmployeeById.mockResolvedValue(null);

        const result = await insertIntoBlacklist("id-inexistente");

        // Cambiado de result.type a result.code según el estándar del Service Layer
        expect(result.code).toBe(RESPONSES.BLACKLIST.EMPLOYEE_NOT_FOUND);
        expect(transactionalBlacklistInsert).not.toHaveBeenCalled();
    });

    it("retorna INSERT_FAILED si falla la transacción en base de datos", async () => {
        findEmployeeById.mockResolvedValue(mockEmployee);
        // Simulamos que la transacción falla y retorna null
        transactionalBlacklistInsert.mockResolvedValue(null);

        const result = await insertIntoBlacklist(mockEmployee.employeeId);

        expect(result.code).toBe(RESPONSES.BLACKLIST.INSERT_FAILED);
    });

    it("retorna ADDED con data correcta cuando la transacción es exitosa", async () => {
        findEmployeeById.mockResolvedValue(mockEmployee);
        transactionalBlacklistInsert.mockResolvedValue(mockBlacklistEntry);

        const result = await insertIntoBlacklist(mockEmployee.employeeId);

        expect(result.code).toBe(RESPONSES.BLACKLIST.ADDED);
        expect(result.data.employeeFullName).toBe("Luis Pérez");
        expect(result.data.curp).toBe(mockEmployee.curp);
        expect(result.data.blacklistEntry).toEqual(mockBlacklistEntry);
    });

    it("llama a transactionalBlacklistInsert con el employeeId y curp correctos", async () => {
        findEmployeeById.mockResolvedValue(mockEmployee);
        transactionalBlacklistInsert.mockResolvedValue(mockBlacklistEntry);

        await insertIntoBlacklist(mockEmployee.employeeId);

        expect(transactionalBlacklistInsert).toHaveBeenCalledWith(
            mockEmployee.employeeId,
            mockEmployee.curp,
        );
    });
});
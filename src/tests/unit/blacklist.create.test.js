jest.mock("../../model/blacklist/get.model", () => ({
    findEmployeeById: jest.fn(),
}));

jest.mock("../../model/blacklist/patch.model", () => ({
    deactivateEmployee: jest.fn(),
}));

jest.mock("../../model/blacklist/create.model", () => ({
    insertBlacklist: jest.fn(),
}));

const { findEmployeeById } = require("../../model/blacklist/get.model");
const { deactivateEmployee } = require("../../model/blacklist/patch.model");
const { insertBlacklist } = require("../../model/blacklist/create.model");
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

        expect(result.type).toBe(RESPONSES.BLACKLIST.EMPLOYEE_NOT_FOUND);
        expect(deactivateEmployee).not.toHaveBeenCalled();
        expect(insertBlacklist).not.toHaveBeenCalled();
    });

    it("retorna DEACTIVATION_FAILED si falla la desactivación del empleado", async () => {
        findEmployeeById.mockResolvedValue(mockEmployee);
        deactivateEmployee.mockResolvedValue(null);

        const result = await insertIntoBlacklist(mockEmployee.employeeId);

        expect(result.type).toBe(RESPONSES.BLACKLIST.DEACTIVATION_FAILED);
        expect(insertBlacklist).not.toHaveBeenCalled();
    });

    it("retorna INSERT_FAILED si falla la inserción en la lista negra", async () => {
        findEmployeeById.mockResolvedValue(mockEmployee);
        deactivateEmployee.mockResolvedValue(true);
        insertBlacklist.mockResolvedValue(null);

        const result = await insertIntoBlacklist(mockEmployee.employeeId);

        expect(result.type).toBe(RESPONSES.BLACKLIST.INSERT_FAILED);
    });

    it("retorna ADDED con data correcta cuando todo es exitoso", async () => {
        findEmployeeById.mockResolvedValue(mockEmployee);
        deactivateEmployee.mockResolvedValue(true);
        insertBlacklist.mockResolvedValue(mockBlacklistEntry);

        const result = await insertIntoBlacklist(mockEmployee.employeeId);

        expect(result.type).toBe(RESPONSES.BLACKLIST.ADDED);
        expect(result.data.employeeFullName).toBe("Luis Pérez");
        expect(result.data.curp).toBe(mockEmployee.curp);
        expect(result.data.blacklistEntry).toEqual(mockBlacklistEntry);
    });

    it("llama a insertBlacklist con el employeeId y curp correctos", async () => {
        findEmployeeById.mockResolvedValue(mockEmployee);
        deactivateEmployee.mockResolvedValue(true);
        insertBlacklist.mockResolvedValue(mockBlacklistEntry);

        await insertIntoBlacklist(mockEmployee.employeeId);

        expect(insertBlacklist).toHaveBeenCalledWith(
            mockEmployee.employeeId,
            mockEmployee.curp,
        );
    });

    it("llama a deactivateEmployee con el employeeId correcto", async () => {
        findEmployeeById.mockResolvedValue(mockEmployee);
        deactivateEmployee.mockResolvedValue(true);
        insertBlacklist.mockResolvedValue(mockBlacklistEntry);

        await insertIntoBlacklist(mockEmployee.employeeId);

        expect(deactivateEmployee).toHaveBeenCalledWith(mockEmployee.employeeId);
    });

    it("no llama a insertBlacklist si la desactivación falla", async () => {
        findEmployeeById.mockResolvedValue(mockEmployee);
        deactivateEmployee.mockResolvedValue(null);

        await insertIntoBlacklist(mockEmployee.employeeId);

        expect(insertBlacklist).not.toHaveBeenCalled();
    });
});
jest.mock("../../model/blacklist/get.model", () => ({
    findEmployeeByCurp: jest.fn(),
}));

jest.mock("../../model/blacklist/patch.model", () => ({
    transactionalBlacklistInsert: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
    createLog: jest.fn(),
}));

const { findEmployeeByCurp } = require("../../model/blacklist/get.model");
const { transactionalBlacklistInsert } = require("../../model/blacklist/patch.model");
const { createLog } = require("../../model/log.model");
const { insertIntoBlacklist } = require("../../service/blacklist/create.service");
const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");

const mockEmployee = {
    employeeId: "e0000002-0000-4000-8000-000000000002",
    name: "Luis",
    surname: "Pérez",
    curp: "PELM900101HDFRZS09",
    isActive: true,
    isBlacklisted: false,
};

const mockBlacklistEntry = {
    blacklistId: "b0000001-0000-4000-8000-000000000001",
    curp: mockEmployee.curp,
    createdAt: new Date("2026-01-01T00:00:00Z"),
};

const mockExecutorId = "admin-123";
const mockIp = "192.168.1.1";

beforeEach(() => {
    jest.clearAllMocks();
});

describe("insertIntoBlacklist", () => {
    it("retorna EMPLOYEE_NOT_FOUND si el empleado no existe", async () => {
        findEmployeeByCurp.mockResolvedValue(null);

        const result = await insertIntoBlacklist("CURPINEXISTENTE00", mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.BLACKLIST.EMPLOYEE_NOT_FOUND);
        expect(transactionalBlacklistInsert).not.toHaveBeenCalled();
    });

    it("retorna ALREADY_EXISTS si el empleado ya está en la lista negra", async () => {
        findEmployeeByCurp.mockResolvedValue({ ...mockEmployee, isBlacklisted: true });

        const result = await insertIntoBlacklist(mockEmployee.curp, mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.BLACKLIST.ALREADY_EXISTS);
        expect(transactionalBlacklistInsert).not.toHaveBeenCalled();
    });

    it("retorna INSERT_FAILED si falla la transacción en base de datos", async () => {
        findEmployeeByCurp.mockResolvedValue(mockEmployee);
        transactionalBlacklistInsert.mockResolvedValue(null);

        const result = await insertIntoBlacklist(mockEmployee.curp, mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.BLACKLIST.INSERT_FAILED);
        expect(createLog).not.toHaveBeenCalled();
    });

    it("retorna ADDED con un warning si falla la creación del log", async () => {
        findEmployeeByCurp.mockResolvedValue(mockEmployee);
        transactionalBlacklistInsert.mockResolvedValue(mockBlacklistEntry);
        createLog.mockRejectedValue(new Error("Database error on log"));

        const result = await insertIntoBlacklist(mockEmployee.curp, mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.BLACKLIST.ADDED);
        expect(result.data.warning).toBe("Empleado agregado a la lista negra, pero falló el registro de auditoría (log).");
    });

    it("debe retornar INTERNAL_ERROR si ocurre una excepción inesperada en el servicio", async () => {
        const dbError = new Error("Error fatal de conexión");
        findEmployeeByCurp.mockRejectedValue(dbError);

        const result = await insertIntoBlacklist(mockEmployee.curp, mockExecutorId, mockIp);
        expect(result.code).toBe(RESPONSES.BLACKLIST.INTERNAL_ERROR);
    });

    it("retorna ADDED con data correcta y genera el log cuando todo es exitoso", async () => {
        findEmployeeByCurp.mockResolvedValue(mockEmployee);
        transactionalBlacklistInsert.mockResolvedValue(mockBlacklistEntry);
        createLog.mockResolvedValue(true);

        const result = await insertIntoBlacklist(mockEmployee.curp, mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.BLACKLIST.ADDED);
        expect(result.data.employeeFullName).toBe("Luis Pérez");
        expect(result.data.curp).toBe(mockEmployee.curp);
        expect(result.data.blacklistEntry).toEqual(mockBlacklistEntry);
        
        expect(transactionalBlacklistInsert).toHaveBeenCalledWith(mockEmployee.curp);

        expect(createLog).toHaveBeenCalledWith(
            mockExecutorId,
            LOG_ACTIONS.BLACKLIST_ADDED,
            mockIp,
            "Luis Pérez - PELM900101HDFRZS09"
        );
    });
});
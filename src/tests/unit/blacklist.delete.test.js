jest.mock("../../model/blacklist/get.model", () => ({
    findEmployeeByCurp: jest.fn(),
}));

jest.mock("../../model/blacklist/delete.model", () => ({
    deleteFromBlacklist: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
    createLog: jest.fn(),
}));

const { findEmployeeByCurp } = require("../../model/blacklist/get.model");
const { deleteFromBlacklist } = require("../../model/blacklist/delete.model");
const { createLog } = require("../../model/log.model");
const { removeFromBlacklist } = require("../../service/blacklist/delete.service");
const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");

const mockEmployee = {
    employeeId: "e0000002-0000-4000-8000-000000000002",
    name: "Luis",
    surname: "Pérez",
    curp: "PELM900101HDFRZS09",
    isActive: false,
    isBlacklisted: true,
};

const mockDeletedEntry = {
    blacklistId: "b0000001-0000-4000-8000-000000000001",
    curp: mockEmployee.curp,
    reason: "Infracción a políticas",
    createdAt: new Date("2026-01-01T00:00:00Z"),
};

const mockExecutorId = "admin-123";
const mockIp = "192.168.1.1";
const mockReason = "Se aclaró la situación";

beforeEach(() => {
    jest.clearAllMocks();
});

describe("removeFromBlacklist", () => {
    it("retorna EMPLOYEE_NOT_FOUND si el empleado no existe", async () => {
        findEmployeeByCurp.mockResolvedValue(null);

        const result = await removeFromBlacklist("CURPINEXISTENTE00", mockReason, mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
        expect(deleteFromBlacklist).not.toHaveBeenCalled();
    });

    it("retorna NOT_IN_BLACKLIST si el empleado no está en la lista negra", async () => {
        findEmployeeByCurp.mockResolvedValue({ ...mockEmployee, isBlacklisted: false });

        const result = await removeFromBlacklist(mockEmployee.curp, mockReason, mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.BLACKLIST.NOT_IN_BLACKLIST);
        expect(deleteFromBlacklist).not.toHaveBeenCalled();
    });

    it("retorna INTERNAL_ERROR si falla la eliminación en base de datos", async () => {
        findEmployeeByCurp.mockResolvedValue(mockEmployee);
        deleteFromBlacklist.mockResolvedValue(null);

        const result = await removeFromBlacklist(mockEmployee.curp, mockReason, mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.BLACKLIST.INTERNAL_ERROR);
        expect(createLog).not.toHaveBeenCalled();
    });

    it("retorna REMOVED con un warning si falla la creación del log", async () => {
        findEmployeeByCurp.mockResolvedValue(mockEmployee);
        deleteFromBlacklist.mockResolvedValue(mockDeletedEntry);
        createLog.mockRejectedValue(new Error("Database error on log"));

        const result = await removeFromBlacklist(mockEmployee.curp, mockReason, mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.BLACKLIST.REMOVED);
        expect(result.data.warning).toBe("Empleado eliminado de la lista negra, pero falló el registro de auditoría (log).");
    });

    it("debe retornar INTERNAL_ERROR si ocurre una excepción inesperada en el servicio", async () => {
        findEmployeeByCurp.mockRejectedValue(new Error("Error fatal de conexión"));

        const result = await removeFromBlacklist(mockEmployee.curp, mockReason, mockExecutorId, mockIp);
        expect(result.code).toBe(RESPONSES.BLACKLIST.INTERNAL_ERROR);
    });

    it("retorna REMOVED con data correcta y genera el log truncando a 120 caracteres si es muy largo", async () => {
        findEmployeeByCurp.mockResolvedValue(mockEmployee);
        deleteFromBlacklist.mockResolvedValue(mockDeletedEntry);
        createLog.mockResolvedValue(true);

        const longReason = "Esta es una razón exageradamente larga que superará el límite de los ciento veinte caracteres configurados en el campo affected de la tabla logs para probar el truncamiento inteligente";
        const result = await removeFromBlacklist(mockEmployee.curp, longReason, mockExecutorId, mockIp);

        expect(result.code).toBe(RESPONSES.BLACKLIST.REMOVED);
        expect(result.data.employeeFullName).toBe("Luis Pérez");
        expect(result.data.curp).toBe(mockEmployee.curp);

        expect(deleteFromBlacklist).toHaveBeenCalledWith(mockEmployee.curp);

        const expectedTruncatedText = `Luis Pérez - PELM900101HDFRZS09 Razón: ${longReason}`.substring(0, 117) + "...";

        expect(createLog).toHaveBeenCalledWith(
            mockExecutorId,
            LOG_ACTIONS.BLACKLIST_REMOVED,
            mockIp,
            expectedTruncatedText
        );
    });
});
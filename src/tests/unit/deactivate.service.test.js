const {
    deactivateEmployee,
} = require("../../service/employee/deactivate.service");
jest.mock("../../model/employee/deactivate.model");
jest.mock("../../model/log.model");

const deactivateModel = require("../../model/employee/deactivate.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");

const MOCK_EMPLOYEE = {
    employeeId: "uuid-empleado-001",
    name: "Carlos",
    surname: "Ramírez",
    houseId: "uuid-house-001",
    curp: "RAMC900101HDFRZN01",
    isActive: true,
    isBlacklisted: false,
};

const buildReq = (overrides = {}) => ({
    params: { employeeId: "uuid-empleado-001" },
    body: { reason: "Renuncia voluntaria" },
    user: { id: "uuid-actor-001", houseId: "uuid-house-001" },
    headers: { "x-forwarded-for": "127.0.0.1" },
    ...overrides,
});

describe("deactivate.service — deactivateEmployee", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("Flujo alternativo — auto-baja", () => {
        it("retorna CANNOT_DEACTIVATE_SELF si actorId es igual a employeeId", async () => {
            const req = buildReq({ user: { id: "uuid-empleado-001", houseId: "uuid-house-001" } });
            const result = await deactivateEmployee(req);
            expect(result.code).toBe(RESPONSES.EMPLOYEE.CANNOT_DEACTIVATE_SELF);
        });
    });

    describe("Flujo alternativo — empleado no encontrado", () => {
        it("retorna EMPLOYEE_NOT_FOUND cuando el model devuelve null", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue(null);
            const result = await deactivateEmployee(buildReq());
            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
        });

        it("no llama a deactivateEmployee del model si el empleado no existe", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue(null);
            await deactivateEmployee(buildReq());
            expect(deactivateModel.deactivateEmployee).not.toHaveBeenCalled();
        });
    });

    describe("Flujo alternativo — empleado ya inactivo", () => {
        it("retorna EMPLOYEE_ALREADY_INACTIVE cuando isActive es false", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue({
                ...MOCK_EMPLOYEE,
                isActive: false,
            });
            const result = await deactivateEmployee(buildReq());
            expect(result.code).toBe(RESPONSES.EMPLOYEE.ALREADY_INACTIVE);
        });

        it("no llama a deactivateEmployee del model si ya está inactivo", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue({
                ...MOCK_EMPLOYEE,
                isActive: false,
            });
            await deactivateEmployee(buildReq());
            expect(deactivateModel.deactivateEmployee).not.toHaveBeenCalled();
        });
    });

    describe("Flujo alternativo — empleado ya en lista negra", () => {
        it("retorna ALREADY_BLACKLISTED si se solicita lista negra y ya está", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue({
                ...MOCK_EMPLOYEE,
                isBlacklisted: true,
            });
            const result = await deactivateEmployee(buildReq({ body: { reason: "test", addToBlacklist: true } }));
            expect(result.code).toBe(RESPONSES.EMPLOYEE.ALREADY_BLACKLISTED);
        });
    });

    describe("Flujo exitoso — añadir a lista negra a empleado ya inactivo", () => {
        it("retorna DEACTIVATED y procesa correctamente si isActive es false pero addToBlacklist es true", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue({ ...MOCK_EMPLOYEE, isActive: false });
            deactivateModel.deactivateEmployee.mockResolvedValue(undefined);
            createLog.mockResolvedValue(undefined);
            
            const result = await deactivateEmployee(buildReq({ body: { reason: "test", addToBlacklist: true } }));
            expect(result.code).toBe(RESPONSES.EMPLOYEE.DEACTIVATED);
            expect(deactivateModel.deactivateEmployee).toHaveBeenCalledWith("uuid-empleado-001", "test", "RAMC900101HDFRZN01", false);
        });
    });

    describe("Flujo exitoso — dado de baja", () => {
        beforeEach(() => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue(
                MOCK_EMPLOYEE,
            );
            deactivateModel.deactivateEmployee.mockResolvedValue(undefined);
            createLog.mockResolvedValue(undefined);
        });

        it("retorna EMPLOYEE_DEACTIVATED y el nombre del empleado", async () => {
            const result = await deactivateEmployee(buildReq());
            expect(result.code).toBe(RESPONSES.EMPLOYEE.DEACTIVATED);
            expect(result.data.name).toBe("Carlos");
        });

        it("llama a deactivateEmployee del model con el employeeId y razón correctos", async () => {
            const req = buildReq({ body: { reason: "Renuncia voluntaria", addToBlacklist: true } });
            await deactivateEmployee(req);
            expect(deactivateModel.deactivateEmployee).toHaveBeenCalledWith(
                "uuid-empleado-001",
                "Renuncia voluntaria",
                "RAMC900101HDFRZN01",
                true
            );
        });

        it("crea log EMPLOYEE_DEACTIVATED después de dar de baja", async () => {
            await deactivateEmployee(buildReq());
            expect(createLog).toHaveBeenCalledWith(
                "uuid-actor-001",
                LOG_ACTIONS.EMPLOYEE_DEACTIVATED,
                expect.any(String),
                "uuid-empleado-001",
            );
        });
    });

    describe("Flujo alternativo — fallo al dar de baja", () => {
        beforeEach(() => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue(
                MOCK_EMPLOYEE,
            );
            deactivateModel.deactivateEmployee.mockRejectedValue(
                new Error("DB error"),
            );
            createLog.mockResolvedValue(undefined);
        });

        it("retorna EMPLOYEE_DEACTIVATION_FAILED y el nombre del empleado cuando el model lanza error", async () => {
            const result = await deactivateEmployee(buildReq());
            expect(result.code).toBe(RESPONSES.EMPLOYEE.DEACTIVATION_FAILED);
            expect(result.data.name).toBe("Carlos");
        });

        it("crea log EMPLOYEE_DEACTIVATION_FAILED cuando falla la baja", async () => {
            await deactivateEmployee(buildReq());
            expect(createLog).toHaveBeenCalledWith(
                "uuid-actor-001",
                LOG_ACTIONS.EMPLOYEE_DEACTIVATION_FAILED,
                expect.any(String),
                "uuid-empleado-001",
            );
        });
    });
});

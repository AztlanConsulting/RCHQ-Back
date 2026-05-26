const { reactivateEmployeeService } = require("../../service/employee/update.service");

jest.mock("../../model/employee/deactivate.model");
jest.mock("../../model/employee/update.model");
jest.mock("../../model/log.model");
jest.mock("../../utils/ip", () => ({ getClientIp: jest.fn(() => "127.0.0.1") }));

const deactivateModel = require("../../model/employee/deactivate.model");
const updateModel = require("../../model/employee/update.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");

const MOCK_INACTIVE = {
    employeeId: "uuid-inactive",
    name: "Ana",
    surname: "Lopez",
    houseId: "uuid-house",
    isActive: false,
    isBlacklisted: false,
};

const buildReq = (overrides = {}) => ({
    params: { employeeId: MOCK_INACTIVE.employeeId },
    user: { id: "uuid-actor", houseId: "uuid-house" },
    ...overrides,
});

describe("reactivateEmployee.service — reactivateEmployeeService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("auto-reactivación", () => {
        it("retorna CANNOT_REACTIVATE_SELF cuando actorId === employeeId", async () => {
            const req = buildReq({ user: { id: MOCK_INACTIVE.employeeId, houseId: "uuid-house" } });
            const result = await reactivateEmployeeService(req);
            expect(result.code).toBe(RESPONSES.EMPLOYEE.CANNOT_REACTIVATE_SELF);
            expect(updateModel.reactivateEmployee).not.toHaveBeenCalled();
        });
    });

    describe("empleado no encontrado", () => {
        it("retorna NOT_FOUND y no llama al model cuando getEmployeeToDeactivate devuelve null", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue(null);
            const result = await reactivateEmployeeService(buildReq());
            expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
            expect(updateModel.reactivateEmployee).not.toHaveBeenCalled();
        });
    });

    describe("empleado ya activo", () => {
        it("retorna ALREADY_ACTIVE cuando isActive es true", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue({
                ...MOCK_INACTIVE,
                isActive: true,
            });
            const result = await reactivateEmployeeService(buildReq());
            expect(result.code).toBe(RESPONSES.EMPLOYEE.ALREADY_ACTIVE);
            expect(updateModel.reactivateEmployee).not.toHaveBeenCalled();
        });
    });

    describe("lista negra", () => {
        it("retorna ALREADY_BLACKLISTED cuando isBlacklisted es true", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue({
                ...MOCK_INACTIVE,
                isBlacklisted: true,
            });
            const result = await reactivateEmployeeService(buildReq());
            expect(result.code).toBe(RESPONSES.EMPLOYEE.ALREADY_BLACKLISTED);
            expect(updateModel.reactivateEmployee).not.toHaveBeenCalled();
        });
    });

    describe("uso de req.resolvedEmployee", () => {
        it("usa resolvedEmployee cuando ya viene poblado por el middleware", async () => {
            const emp = { ...MOCK_INACTIVE };
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue(null);
            updateModel.reactivateEmployee.mockResolvedValue({});
            createLog.mockResolvedValue(undefined);

            const result = await reactivateEmployeeService(
                buildReq({ resolvedEmployee: emp }),
            );

            expect(deactivateModel.getEmployeeToDeactivate).not.toHaveBeenCalled();
            expect(updateModel.reactivateEmployee).toHaveBeenCalledWith(MOCK_INACTIVE.employeeId);
            expect(result.code).toBe(RESPONSES.EMPLOYEE.REACTIVATED);
        });
    });

    describe("reactivación exitosa", () => {
        it("retorna REACTIVATED, actualiza BD y registra log", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue(MOCK_INACTIVE);
            updateModel.reactivateEmployee.mockResolvedValue({});
            createLog.mockResolvedValue(undefined);

            const req = buildReq();
            const result = await reactivateEmployeeService(req);

            expect(result).toEqual({
                code: RESPONSES.EMPLOYEE.REACTIVATED,
                data: { name: "Ana" },
            });
            expect(updateModel.reactivateEmployee).toHaveBeenCalledWith(MOCK_INACTIVE.employeeId);
            expect(createLog).toHaveBeenCalledWith(
                "uuid-actor",
                LOG_ACTIONS.EMPLOYEE_REACTIVATED,
                "127.0.0.1",
                MOCK_INACTIVE.employeeId,
            );
        });

        it("sigue OK si falla únicamente el log de auditoría", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue(MOCK_INACTIVE);
            updateModel.reactivateEmployee.mockResolvedValue({});
            createLog.mockRejectedValue(new Error("log fail"));

            const result = await reactivateEmployeeService(buildReq());

            expect(result.code).toBe(RESPONSES.EMPLOYEE.REACTIVATED);
        });
    });

    describe("fallo en Prisma / model", () => {
        it("retorna REACTIVATION_FAILED cuando reactivateEmployee lanza error", async () => {
            deactivateModel.getEmployeeToDeactivate.mockResolvedValue(MOCK_INACTIVE);
            updateModel.reactivateEmployee.mockRejectedValue(new Error("db"));

            const result = await reactivateEmployeeService(buildReq());

            expect(result.code).toBe(RESPONSES.EMPLOYEE.REACTIVATION_FAILED);
            expect(result.data).toEqual({ name: "Ana" });
        });
    });
});

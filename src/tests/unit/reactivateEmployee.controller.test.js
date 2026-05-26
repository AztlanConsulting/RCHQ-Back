const { reactivateEmployeeController } = require("../../controller/employee/update.controller");

jest.mock("../../service/employee/update.service", () => ({
    updateBasicInfoService: jest.fn(),
    updateContactInfoService: jest.fn(),
    updateAdminInfoService: jest.fn(),
    updateDocument: jest.fn(),
    reactivateEmployeeService: jest.fn(),
}));

const updateService = require("../../service/employee/update.service");
const RESPONSES = require("../../utils/responses");

const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const buildReq = (overrides = {}) => ({
    params: { employeeId: "uuid-empleado" },
    user: { id: "uuid-actor" },
    ...overrides,
});

describe("reactivateEmployee.controller — reactivateEmployeeController", () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = buildReq();
        res = buildRes();
    });

    it("200 — REACTIVATED", async () => {
        updateService.reactivateEmployeeService.mockResolvedValue({
            code: RESPONSES.EMPLOYEE.REACTIVATED,
            data: { name: "Carlos" },
        });
        await reactivateEmployeeController(req, res);
        expect(updateService.reactivateEmployeeService).toHaveBeenCalledWith(req);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: '"Carlos" ha sido reactivado' });
    });

    it("400 — CANNOT_REACTIVATE_SELF", async () => {
        updateService.reactivateEmployeeService.mockResolvedValue({
            code: RESPONSES.EMPLOYEE.CANNOT_REACTIVATE_SELF,
        });
        await reactivateEmployeeController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "No puedes reactivar a ti mismo" });
    });

    it("404 — NOT_FOUND", async () => {
        updateService.reactivateEmployeeService.mockResolvedValue({
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        });
        await reactivateEmployeeController(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Empleado no encontrado" });
    });

    it("409 — ALREADY_ACTIVE", async () => {
        updateService.reactivateEmployeeService.mockResolvedValue({
            code: RESPONSES.EMPLOYEE.ALREADY_ACTIVE,
        });
        await reactivateEmployeeController(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: "El empleado ya está activo" });
    });

    it("409 — ALREADY_BLACKLISTED", async () => {
        updateService.reactivateEmployeeService.mockResolvedValue({
            code: RESPONSES.EMPLOYEE.ALREADY_BLACKLISTED,
        });
        await reactivateEmployeeController(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            message: "El empleado se encuentra en la lista negra",
        });
    });

    it("400 — REACTIVATION_FAILED", async () => {
        updateService.reactivateEmployeeService.mockResolvedValue({
            code: RESPONSES.EMPLOYEE.REACTIVATION_FAILED,
            data: { name: "Luisa" },
        });
        await reactivateEmployeeController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Hubo un error al reactivar a "Luisa".',
        });
    });

    it("500 — código no mapeado", async () => {
        updateService.reactivateEmployeeService.mockResolvedValue({ code: "UNKNOWN" });
        await reactivateEmployeeController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error inesperado" });
    });

    it("500 — el service lanza excepción", async () => {
        updateService.reactivateEmployeeService.mockRejectedValue(new Error("boom"));
        await reactivateEmployeeController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error interno del servidor" });
    });
});

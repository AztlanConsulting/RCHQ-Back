const {
    deactivateEmployeeController,
} = require("../../controller/employee/deactivate.controller");

jest.mock("../../service/employee/deactivate.service");
const deactivateService = require("../../service/employee/deactivate.service");
const RESPONSES = require("../../utils/responses");

const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const buildReq = (overrides = {}) => ({
    params: { employeeId: "uuid-empleado-001" },
    body: { reason: "Renuncia voluntaria" },
    user: { id: "uuid-actor-001" },
    ...overrides,
});

describe("deactivate.controller — deactivateEmployeeController", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = buildReq();
        res = buildRes();
    });

    describe("Flujo exitoso — dado de baja (200)", () => {
        it("responde 200 cuando el service retorna EMPLOYEE_DEACTIVATED", async () => {
            deactivateService.deactivateEmployee.mockResolvedValue({
                code: RESPONSES.EMPLOYEE.DEACTIVATED,
                data: { name: "Carlos" },
            });
            await deactivateEmployeeController(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: '"Carlos" ha sido dado de baja',
            });
        });

        it("llama al service con el req completo", async () => {
            deactivateService.deactivateEmployee.mockResolvedValue({
                code: RESPONSES.EMPLOYEE.DEACTIVATED,
                data: { name: "Carlos" },
            });
            await deactivateEmployeeController(req, res);
            expect(deactivateService.deactivateEmployee).toHaveBeenCalledWith(
                req,
            );
        });
    });

    describe("Flujo alternativo — empleado no encontrado (404)", () => {
        it("responde 404 cuando el service retorna EMPLOYEE_NOT_FOUND", async () => {
            deactivateService.deactivateEmployee.mockResolvedValue({
                code: RESPONSES.EMPLOYEE.NOT_FOUND,
            });
            await deactivateEmployeeController(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Empleado no encontrado",
            });
        });
    });

    describe("Flujo alternativo — empleado ya inactivo (409)", () => {
        it("responde 409 cuando el service retorna EMPLOYEE_ALREADY_INACTIVE", async () => {
            deactivateService.deactivateEmployee.mockResolvedValue({
                code: RESPONSES.EMPLOYEE.ALREADY_INACTIVE,
            });
            await deactivateEmployeeController(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                message: "El empleado ya está dado de baja",
            });
        });
    });

    describe("Flujo alternativo — fallo al dar de baja (400)", () => {
        it("responde 400 cuando el service retorna EMPLOYEE_DEACTIVATION_FAILED", async () => {
            deactivateService.deactivateEmployee.mockResolvedValue({
                code: RESPONSES.EMPLOYEE.DEACTIVATION_FAILED,
                data: { name: "Carlos" },
            });
            await deactivateEmployeeController(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Hubo un error al dar de baja a "Carlos".',
            });
        });
    });

    describe("Flujo alternativo — código de respuesta desconocido (500)", () => {
        it("responde 500 cuando el service retorna un código no mapeado", async () => {
            deactivateService.deactivateEmployee.mockResolvedValue({
                code: "CODIGO_DESCONOCIDO",
            });
            await deactivateEmployeeController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Error inesperado",
            });
        });
    });

    describe("Flujo alternativo — excepción inesperada (500)", () => {
        it("responde 500 cuando el service lanza una excepción", async () => {
            deactivateService.deactivateEmployee.mockRejectedValue(
                new Error("Unexpected DB failure"),
            );
            await deactivateEmployeeController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Error interno del servidor",
            });
        });
    });
});

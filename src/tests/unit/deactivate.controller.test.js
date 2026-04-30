// src/tests/unit/deactivate.controller.test.js
const {
  deactivateEmployeeController,
} = require("../../controller/employee/deactivate.controller");

jest.mock("../../service/employee/deactivate.service");
const deactivateService = require("../../service/employee/deactivate.service");
const RESPONSES = require("../../utils/responses");

// ─── Helper ───────────────────────────────────────────────────────────────────
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const buildReq = (overrides = {}) => ({
  params: { employeeId: "uuid-empleado-001" },
  body: { reason: "Renuncia voluntaria", intoBlacklist: false },
  user: { id: "uuid-actor-001" },
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("deactivate.controller — deactivateEmployeeController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = buildReq();
    res = buildRes();
  });

  // ── 200: dado de baja ──────────────────────────────────────────────────────
  describe("Flujo exitoso — dado de baja sin lista negra (200)", () => {
    it("responde 200 cuando el service retorna EMPLOYEE_DEACTIVATED", async () => {
      deactivateService.deactivateEmployee.mockResolvedValue({
        code: RESPONSES.employee.deactivated,
      });

      await deactivateEmployeeController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Empleado dado de baja exitosamente",
      });
    });

    it("llama al service con el req completo", async () => {
      deactivateService.deactivateEmployee.mockResolvedValue({
        code: RESPONSES.employee.deactivated,
      });

      await deactivateEmployeeController(req, res);

      expect(deactivateService.deactivateEmployee).toHaveBeenCalledWith(req);
    });
  });

  // ── 200: dado de baja y en lista negra ────────────────────────────────────
  describe("Flujo exitoso — dado de baja y agregado a lista negra (200)", () => {
    it("responde 200 cuando el service retorna EMPLOYEE_DEACTIVATED_AND_BLACKLISTED", async () => {
      deactivateService.deactivateEmployee.mockResolvedValue({
        code: RESPONSES.employee.deactivatedAndBlacklisted,
      });

      await deactivateEmployeeController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Empleado dado de baja y agregado a la lista negra",
      });
    });
  });

  // ── 404: empleado no encontrado ───────────────────────────────────────────
  describe("Flujo alternativo — empleado no encontrado (404)", () => {
    it("responde 404 cuando el service retorna EMPLOYEE_NOT_FOUND", async () => {
      deactivateService.deactivateEmployee.mockResolvedValue({
        code: RESPONSES.employee.notFound,
      });

      await deactivateEmployeeController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Empleado no encontrado",
      });
    });
  });

  // ── 409: empleado ya inactivo ─────────────────────────────────────────────
  describe("Flujo alternativo — empleado ya inactivo (409)", () => {
    it("responde 409 cuando el service retorna EMPLOYEE_ALREADY_INACTIVE", async () => {
      deactivateService.deactivateEmployee.mockResolvedValue({
        code: RESPONSES.employee.alreadyInactive,
      });

      await deactivateEmployeeController(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "El empleado ya está dado de baja",
      });
    });
  });

  // ── 400: fallo al dar de baja ─────────────────────────────────────────────
  describe("Flujo alternativo — fallo al dar de baja (400)", () => {
    it("responde 400 cuando el service retorna EMPLOYEE_DEACTIVATION_FAILED", async () => {
      deactivateService.deactivateEmployee.mockResolvedValue({
        code: RESPONSES.employee.deactivationFailed,
      });

      await deactivateEmployeeController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Hubo un error al dar de baja al empleado",
      });
    });
  });

  // ── 400: dado de baja pero fallo en lista negra ───────────────────────────
  describe("Flujo alternativo — dado de baja pero fallo en lista negra (400)", () => {
    it("responde 400 cuando el service retorna EMPLOYEE_DEACTIVATED_BLACKLIST_FAILED", async () => {
      deactivateService.deactivateEmployee.mockResolvedValue({
        code: RESPONSES.employee.deactivatedBlacklistFailed,
      });

      await deactivateEmployeeController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "Empleado dado de baja, pero hubo un error al agregarlo a la lista negra",
      });
    });
  });

  // ── 500: código inesperado ────────────────────────────────────────────────
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

  // ── 500: excepción del service ────────────────────────────────────────────
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

    it("no propaga el error al caller (catch interno)", async () => {
      deactivateService.deactivateEmployee.mockRejectedValue(
        new Error("boom"),
      );

      await expect(
        deactivateEmployeeController(req, res),
      ).resolves.not.toThrow();
    });
  });
});
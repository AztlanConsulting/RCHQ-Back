// src/tests/unit/deactivate.service.test.js
const { deactivateEmployee } = require("../../service/employee/deactivate.service");

jest.mock("../../model/employee/deactivate.model");
jest.mock("../../model/log.model");

const deactivateModel = require("../../model/employee/deactivate.model");
const { createLog } = require("../../model/log.model");
const RESPONSES = require("../../utils/responses");
const { LOG_ACTIONS } = require("../../utils/logActions");

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_EMPLOYEE = {
  employeeId: "uuid-empleado-001",
  name: "Carlos",
  surname: "Ramírez",
  houseId: "uuid-house-001",
  curp: "RAMC900101HDFRZN01",
  isActive: true,
};

const buildReq = (overrides = {}) => ({
  params: { employeeId: "uuid-empleado-001" },
  body: { reason: "Renuncia voluntaria", intoBlacklist: false },
  user: { id: "uuid-actor-001", houseId: "uuid-house-001" },
  headers: { "x-forwarded-for": "127.0.0.1" },
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("deactivate.service — deactivateEmployee", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Empleado no encontrado ─────────────────────────────────────────────────
  describe("Flujo alternativo — empleado no encontrado", () => {
    it("retorna EMPLOYEE_NOT_FOUND cuando el model devuelve null", async () => {
      deactivateModel.getEmployeeToDeactivate.mockResolvedValue(null);

      const result = await deactivateEmployee(buildReq());

      expect(result.code).toBe(RESPONSES.employee.notFound);
    });

    it("no llama a deactivateEmployee del model si el empleado no existe", async () => {
      deactivateModel.getEmployeeToDeactivate.mockResolvedValue(null);

      await deactivateEmployee(buildReq());

      expect(deactivateModel.deactivateEmployee).not.toHaveBeenCalled();
    });
  });

  // ── Empleado ya inactivo ───────────────────────────────────────────────────
  describe("Flujo alternativo — empleado ya inactivo", () => {
    it("retorna EMPLOYEE_ALREADY_INACTIVE cuando isActive es false", async () => {
      deactivateModel.getEmployeeToDeactivate.mockResolvedValue({
        ...MOCK_EMPLOYEE,
        isActive: false,
      });

      const result = await deactivateEmployee(buildReq());

      expect(result.code).toBe(RESPONSES.employee.alreadyInactive);
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

  // ── Baja exitosa sin lista negra ───────────────────────────────────────────
  describe("Flujo exitoso — dado de baja sin lista negra", () => {
    beforeEach(() => {
      deactivateModel.getEmployeeToDeactivate.mockResolvedValue(MOCK_EMPLOYEE);
      deactivateModel.deactivateEmployee.mockResolvedValue(undefined);
      createLog.mockResolvedValue(undefined);
    });

    it("retorna EMPLOYEE_DEACTIVATED cuando intoBlacklist es false", async () => {
      const result = await deactivateEmployee(buildReq());

      expect(result.code).toBe(RESPONSES.employee.deactivated);
    });

    it("llama a deactivateEmployee del model con el employeeId correcto", async () => {
      await deactivateEmployee(buildReq());

      expect(deactivateModel.deactivateEmployee).toHaveBeenCalledWith(
        "uuid-empleado-001",
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

    it("no llama a insertIntoBlacklist cuando intoBlacklist es false", async () => {
      await deactivateEmployee(buildReq());

      expect(deactivateModel.insertIntoBlacklist).not.toHaveBeenCalled();
    });
  });

  // ── Baja exitosa con lista negra ───────────────────────────────────────────
  describe("Flujo exitoso — dado de baja y agregado a lista negra", () => {
    beforeEach(() => {
      deactivateModel.getEmployeeToDeactivate.mockResolvedValue(MOCK_EMPLOYEE);
      deactivateModel.deactivateEmployee.mockResolvedValue(undefined);
      deactivateModel.insertIntoBlacklist.mockResolvedValue(undefined);
      createLog.mockResolvedValue(undefined);
    });

    it("retorna EMPLOYEE_DEACTIVATED_AND_BLACKLISTED cuando intoBlacklist es true", async () => {
      const result = await deactivateEmployee(
        buildReq({ body: { reason: "Conducta inapropiada", intoBlacklist: true } }),
      );

      expect(result.code).toBe(RESPONSES.employee.deactivatedAndBlacklisted);
    });

    it("llama a insertIntoBlacklist con los datos correctos del empleado", async () => {
      await deactivateEmployee(
        buildReq({ body: { reason: "Conducta inapropiada", intoBlacklist: true } }),
      );

      expect(deactivateModel.insertIntoBlacklist).toHaveBeenCalledWith(
        MOCK_EMPLOYEE.curp,
        MOCK_EMPLOYEE.name,
        MOCK_EMPLOYEE.surname,
        "Conducta inapropiada",
      );
    });

    it("crea log EMPLOYEE_INTO_BLACKLIST después de agregar a lista negra", async () => {
      await deactivateEmployee(
        buildReq({ body: { reason: "Conducta inapropiada", intoBlacklist: true } }),
      );

      expect(createLog).toHaveBeenCalledWith(
        "uuid-actor-001",
        LOG_ACTIONS.EMPLOYEE_INTO_BLACKLIST,
        expect.any(String),
        "uuid-empleado-001",
      );
    });
  });

  // ── Fallo al dar de baja ───────────────────────────────────────────────────
  describe("Flujo alternativo — fallo al dar de baja", () => {
    beforeEach(() => {
      deactivateModel.getEmployeeToDeactivate.mockResolvedValue(MOCK_EMPLOYEE);
      deactivateModel.deactivateEmployee.mockRejectedValue(
        new Error("DB error"),
      );
      createLog.mockResolvedValue(undefined);
    });

    it("retorna EMPLOYEE_DEACTIVATION_FAILED cuando el model lanza error", async () => {
      const result = await deactivateEmployee(buildReq());

      expect(result.code).toBe(RESPONSES.employee.deactivationFailed);
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

    it("no intenta agregar a lista negra si la baja falló", async () => {
      await deactivateEmployee(
        buildReq({ body: { reason: "Razón", intoBlacklist: true } }),
      );

      expect(deactivateModel.insertIntoBlacklist).not.toHaveBeenCalled();
    });
  });

  // ── Baja OK pero fallo en lista negra ─────────────────────────────────────
  describe("Flujo alternativo — dado de baja pero fallo en lista negra", () => {
    beforeEach(() => {
      deactivateModel.getEmployeeToDeactivate.mockResolvedValue(MOCK_EMPLOYEE);
      deactivateModel.deactivateEmployee.mockResolvedValue(undefined);
      deactivateModel.insertIntoBlacklist.mockRejectedValue(
        new Error("Blacklist DB error"),
      );
      createLog.mockResolvedValue(undefined);
    });

    it("retorna EMPLOYEE_DEACTIVATED_BLACKLIST_FAILED cuando falla la lista negra", async () => {
      const result = await deactivateEmployee(
        buildReq({ body: { reason: "Razón", intoBlacklist: true } }),
      );

      expect(result.code).toBe(RESPONSES.employee.deactivatedBlacklistFailed);
    });

    it("crea log EMPLOYEE_BLACKLIST_FAILED cuando falla la lista negra", async () => {
      await deactivateEmployee(
        buildReq({ body: { reason: "Razón", intoBlacklist: true } }),
      );

      expect(createLog).toHaveBeenCalledWith(
        "uuid-actor-001",
        LOG_ACTIONS.EMPLOYEE_BLACKLIST_FAILED,
        expect.any(String),
        "uuid-empleado-001",
      );
    });

    it("la baja ya ocurrió antes del fallo en lista negra", async () => {
      await deactivateEmployee(
        buildReq({ body: { reason: "Razón", intoBlacklist: true } }),
      );

      expect(deactivateModel.deactivateEmployee).toHaveBeenCalledTimes(1);
    });
  });
});
// src/tests/unit/update.service.test.js

jest.mock("../../model/employee/update.model", () => ({
  updateBasicInfo:   jest.fn(),
  updateContactInfo: jest.fn(),
  updateAdminInfo:   jest.fn(),
  upsertWorkdays:    jest.fn(),
}));

jest.mock("../../model/employee/get.model", () => ({
  findById:    jest.fn(),
  getAllRoles:  jest.fn(),
  getAllWorkdays:     jest.fn(),
  getAllHouses:       jest.fn(),
  getFrecuencyPaymentOptions: jest.fn(),
  getEmployeesWithWorkdays: jest.fn(),
}));

jest.mock("../../utils/password", () => ({
  encryptValue: jest.fn((v) => `encrypted(${v})`),
}));

jest.mock("../../utils/ip.js", () => ({
  getClientIp: jest.fn(() => "127.0.0.1"),
}));

const {
  updateBasicInfo,
  updateContactInfo,
  updateAdminInfo,
  upsertWorkdays,
} = require("../../model/employee/update.model");
const { 
  findById, 
  getAllRoles,
  getAllWorkdays,
  getAllHouses,
  getFrecuencyPaymentOptions,
  getEmployeesWithWorkdays,
 } = require("../../model/employee/get.model");
const { encryptValue }         = require("../../utils/password");

const {
  updateBasicInfoService,
  updateContactInfoService,
  updateAdminInfoService,
} = require("../../service/employee/update.service");

const { getUpdateFormData } = require("../../service/employee/get.service");

const RESPONSES = require("../../utils/responses");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const REQUESTER_ID  = "r0000001-0000-4000-8000-000000000001";
const EMPLOYEE_ID   = "e0000001-0000-4000-8000-000000000001";
const MOCK_EMPLOYEE = { employee_id: EMPLOYEE_ID, name: "Juan" };

const validBasicBody = {
  name:    "Juan",
  surname: "Pérez",
  curp:    "PEPJ800101HDFRRN09",
};

const validContactBody = {
  email:       "juan@mail.com",
  phoneNumber: "4421234567",
};

const validAdminBody = {
  houseId: "a0000001-0000-4000-8000-000000000001",
  roleId:  "a0000002-0000-4000-8000-000000000001",
  type:    "Asalariado",
  frequencyOfPaymentId: "f0000001-0000-4000-8000-000000000001",
  salary:  15000,
  workdays: [
    { workdayId: "d0000001-0000-4000-8000-000000000001", start: "08:00", end: "17:00" },
  ],
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  findById.mockResolvedValue(MOCK_EMPLOYEE);
  updateBasicInfo.mockResolvedValue();
  updateContactInfo.mockResolvedValue();
  updateAdminInfo.mockResolvedValue();
  upsertWorkdays.mockResolvedValue();
  getAllRoles.mockResolvedValue([{ roleId: "r1", name: "Admin" }]);
  getAllHouses.mockResolvedValue([{ houseId: "h1", name: "Casa Test" }]);
  getAllWorkdays.mockResolvedValue([{ workdayId: "wd1", name: "Lunes" }]);
  getFrecuencyPaymentOptions.mockResolvedValue([{ id: "f1", name: "Quincenal" }]);
  getEmployeesWithWorkdays.mockResolvedValue([
    { employee_id: EMPLOYEE_ID, name: "Juan", surname: "Pérez", employee_workday: [{ workday_id: "wd1", workday: { name: "Lunes" }, start: "08:00", end: "17:00" }] }
  ]);
});

// ══════════════════════════════════════════════════════════════════════════════
// getUpdateFormData
// ═════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// getUpdateFormData
// ═════════════════════════════════════════════════════════════════════════════════

describe("getUpdateFormData", () => {
  it("retorna roles, casas, workdays, opciones de pago, houseId y empleados formateados", async () => {
    const result = await getUpdateFormData("h1"); 
    
    expect(result).toEqual({
      roles:    [{ roleId: "r1", name: "Admin" }],
      houses:   [{ houseId: "h1", name: "Casa Test" }],
      workdays: [{ workdayId: "wd1", name: "Lunes" }],
      houseId:  "h1",
      frecuencyOptions: [{ id: "f1", name: "Quincenal" }],
      employees: [
        {
          employeeId: EMPLOYEE_ID,
          name: "Juan",
          surname: "Pérez",
          workdays: [
            { 
              workdayId: "wd1", 
              name: "Lunes", 
              start: "08:00", 
              end: "17:00" 
            }
          ]
        }
      ]
    });
    
    expect(getAllRoles).toHaveBeenCalledTimes(1);
    expect(getAllHouses).toHaveBeenCalledTimes(1);
    expect(getAllWorkdays).toHaveBeenCalledTimes(1);
    expect(getFrecuencyPaymentOptions).toHaveBeenCalledTimes(1);
    expect(getEmployeesWithWorkdays).toHaveBeenCalledWith("h1");
  });

  it("propaga el error si algún modelo falla", async () => {
    getAllRoles.mockRejectedValue(new Error("DB error"));
    await expect(getUpdateFormData("h1")).rejects.toThrow("DB error");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// updateBasicInfoService
// ══════════════════════════════════════════════════════════════════════════════

describe("updateBasicInfoService", () => {

  describe("Flujo exitoso", () => {
    it("retorna UPDATED con datos válidos", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        validBasicBody,
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.UPDATED);
      expect(updateBasicInfo).toHaveBeenCalledWith(EMPLOYEE_ID, expect.any(Object));
    });

    it("llama a updateBasicInfo con los datos parseados", async () => {
      await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { name: "  Juan  ", surname: "Pérez" },
      });
      expect(updateBasicInfo).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        expect.objectContaining({ name: "Juan" }),
      );
    });

    it("normaliza el CURP a mayúsculas", async () => {
      await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { curp: "pepj800101hdfrrn09" },
      });
      expect(updateBasicInfo).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        expect.objectContaining({ curp: "PEPJ800101HDFRRN09" }),
      );
    });
  });

  describe("BAD_REQUEST", () => {
    it("retorna BAD_REQUEST si requesterId es falsy", async () => {
      const result = await updateBasicInfoService({ requesterId: null, employeeId: EMPLOYEE_ID, body: validBasicBody });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.BAD_REQUEST);
      expect(updateBasicInfo).not.toHaveBeenCalled();
    });

    it("retorna BAD_REQUEST si employeeId es falsy", async () => {
      const result = await updateBasicInfoService({ requesterId: REQUESTER_ID, employeeId: "", body: validBasicBody });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.BAD_REQUEST);
    });

    it("retorna BAD_REQUEST si ambos son falsy", async () => {
      const result = await updateBasicInfoService({ requesterId: undefined, employeeId: undefined, body: validBasicBody });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.BAD_REQUEST);
    });
  });

  describe("NOT_FOUND", () => {
    it("retorna NOT_FOUND si el empleado no existe", async () => {
      findById.mockResolvedValue(null);
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        validBasicBody,
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
      expect(updateBasicInfo).not.toHaveBeenCalled();
    });
  });

  describe("VALIDATION_ERROR", () => {
    it("retorna VALIDATION_ERROR con body vacío", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        {},
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
      expect(result.errors).toBeDefined();
    });

    it("retorna VALIDATION_ERROR con nombre inválido (números)", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { name: "Juan123" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con nombre con emojis", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { name: "Juan😀" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con CURP con longitud incorrecta", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { curp: "CORTA" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con CURP con formato inválido (18 chars pero mal patrón)", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { curp: "111111111111111111" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con NSS de longitud incorrecta", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { nss: "123" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con NSS con letras", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { nss: "123ABC45678" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con CLABE de longitud incorrecta", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { bankAccount: "123" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con fecha de nacimiento formato inválido", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { birthDate: "32-13-2000" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR si el empleado es menor de 18", async () => {
      const tenYearsAgo = `${new Date().getFullYear() - 10}-01-01`;
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { birthDate: tenYearsAgo },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con fecha anterior a 1900", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { birthDate: "1850-01-01" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con campo no permitido (strict)", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { name: "Juan", campoExtraño: "hack" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con intento de SQL injection en nombre", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { name: "Juan'; DROP TABLE employee;--" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con XSS en nombre", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { name: "<script>alert('xss')</script>" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con nombre demasiado largo", async () => {
      const result = await updateBasicInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { name: "A".repeat(51) },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// updateContactInfoService
// ══════════════════════════════════════════════════════════════════════════════

describe("updateContactInfoService", () => {

  describe("Flujo exitoso", () => {
    it("retorna UPDATED con email y teléfono válidos", async () => {
      const result = await updateContactInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        validContactBody,
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.UPDATED);
      expect(updateContactInfo).toHaveBeenCalledWith(EMPLOYEE_ID, expect.any(Object));
    });

    it("retorna UPDATED actualizando solo dirección", async () => {
      const result = await updateContactInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { street: "Calle Falsa 123", postalCode: "76000" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.UPDATED);
    });

    it("convierte el email a minúsculas", async () => {
      await updateContactInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { email: "JUAN@MAIL.COM" },
      });
      expect(updateContactInfo).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        expect.objectContaining({ email: "juan@mail.com" }),
      );
    });
  });

  describe("BAD_REQUEST", () => {
    it("retorna BAD_REQUEST si requesterId es nulo", async () => {
      const result = await updateContactInfoService({ requesterId: null, employeeId: EMPLOYEE_ID, body: validContactBody });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.BAD_REQUEST);
    });

    it("retorna BAD_REQUEST si employeeId es nulo", async () => {
      const result = await updateContactInfoService({ requesterId: REQUESTER_ID, employeeId: null, body: validContactBody });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.BAD_REQUEST);
    });
  });

  describe("NOT_FOUND", () => {
    it("retorna NOT_FOUND si el empleado no existe", async () => {
      findById.mockResolvedValue(null);
      const result = await updateContactInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        validContactBody,
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
      expect(updateContactInfo).not.toHaveBeenCalled();
    });
  });

  describe("VALIDATION_ERROR", () => {
    it("retorna VALIDATION_ERROR con email inválido", async () => {
      const result = await updateContactInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { email: "no-es-un-email" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con email demasiado largo", async () => {
      const result = await updateContactInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { email: `${"a".repeat(70)}@mail.com` },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con body vacío", async () => {
      const result = await updateContactInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        {},
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con campo no permitido", async () => {
      const result = await updateContactInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { email: "juan@mail.com", password: "hack" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con XSS en teléfono", async () => {
      const result = await updateContactInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { phoneNumber: "<script>alert(1)</script>" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// updateAdminInfoService
// ══════════════════════════════════════════════════════════════════════════════

describe("updateAdminInfoService", () => {

  describe("Flujo exitoso", () => {
    it("retorna UPDATED con datos válidos completos", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        validAdminBody,
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.UPDATED);
      expect(updateAdminInfo).toHaveBeenCalled();
      expect(upsertWorkdays).toHaveBeenCalled();
    });

    it("encripta el salario antes de guardarlo", async () => {
      await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { salary: 20000 },
      });
      expect(encryptValue).toHaveBeenCalledWith("20000");
      expect(updateAdminInfo).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        expect.objectContaining({ salary: "encrypted(20000)" }),
      );
    });

    it("no llama a upsertWorkdays si no vienen workdays", async () => {
      await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { type: "Asalariado" },
      });
      expect(upsertWorkdays).not.toHaveBeenCalled();
    });

    it("no llama a updateAdminInfo si solo vienen workdays", async () => {
      await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body: {
          workdays: [
            { workdayId: "d0000001-0000-4000-8000-000000000001", start: "08:00", end: "17:00" },
          ],
        },
      });
      expect(updateAdminInfo).not.toHaveBeenCalled();
      expect(upsertWorkdays).toHaveBeenCalled();
    });

    it("retorna UPDATED actualizando solo casa", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { houseId: "a0000001-0000-4000-8000-000000000002" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.UPDATED);
    });
  });

  describe("BAD_REQUEST", () => {
    it("retorna BAD_REQUEST si requesterId es falsy", async () => {
      const result = await updateAdminInfoService({ requesterId: "", employeeId: EMPLOYEE_ID, body: validAdminBody });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.BAD_REQUEST);
    });

    it("retorna BAD_REQUEST si employeeId es falsy", async () => {
      const result = await updateAdminInfoService({ requesterId: REQUESTER_ID, employeeId: null, body: validAdminBody });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.BAD_REQUEST);
    });
  });

  describe("NOT_FOUND", () => {
    it("retorna NOT_FOUND si el empleado no existe", async () => {
      findById.mockResolvedValue(null);
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        validAdminBody,
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
      expect(updateAdminInfo).not.toHaveBeenCalled();
      expect(upsertWorkdays).not.toHaveBeenCalled();
    });
  });

  describe("VALIDATION_ERROR", () => {
    it("retorna VALIDATION_ERROR con body vacío", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        {},
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con houseId no UUID", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { houseId: "no-es-uuid" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con roleId no UUID", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { roleId: "123" },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con salario negativo", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { salary: -5000 },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con salario cero", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { salary: 0 },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con salario mayor al límite", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { salary: 2_000_000 },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con workday sin workdayId", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body: {
          workdays: [{ start: "08:00", end: "17:00" }],
        },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con workday con start >= end", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body: {
          workdays: [
            { workdayId: "d0000001-0000-4000-8000-000000000001", start: "17:00", end: "08:00" },
          ],
        },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.UPDATED);
    });

    it("retorna VALIDATION_ERROR con formato de hora inválido", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body: {
          workdays: [
            { workdayId: "d0000001-0000-4000-8000-000000000001", start: "8am", end: "5pm" },
          ],
        },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con campo no permitido", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { houseId: "a0000001-0000-4000-8000-000000000001", isActive: true },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con inyección en tipo", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { type: "A".repeat(21) },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });

    it("retorna VALIDATION_ERROR con array vacío de workdays", async () => {
      const result = await updateAdminInfoService({
        requesterId: REQUESTER_ID,
        employeeId:  EMPLOYEE_ID,
        body:        { workdays: [] },
      });
      expect(result.type).toBe(RESPONSES.EMPLOYEE.VALIDATION_ERROR);
    });
  });

  describe("Robustez ante errores del modelo", () => {
    it("propaga el error si updateAdminInfo falla", async () => {
      updateAdminInfo.mockRejectedValue(new Error("DB exploded"));
      await expect(
        updateAdminInfoService({
          requesterId: REQUESTER_ID,
          employeeId:  EMPLOYEE_ID,
          body:        { type: "Asalariado" },
        })
      ).rejects.toThrow("DB exploded");
    });

    it("propaga el error si upsertWorkdays falla", async () => {
      upsertWorkdays.mockRejectedValue(new Error("Workday DB error"));
      await expect(
        updateAdminInfoService({
          requesterId: REQUESTER_ID,
          employeeId:  EMPLOYEE_ID,
          body: {
            workdays: [
              { workdayId: "d0000001-0000-4000-8000-000000000001", start: "08:00", end: "17:00" },
            ],
          },
        })
      ).rejects.toThrow("Workday DB error");
    });

    it("propaga el error si findById falla", async () => {
      findById.mockRejectedValue(new Error("findById DB error"));
      await expect(
        updateAdminInfoService({
          requesterId: REQUESTER_ID,
          employeeId:  EMPLOYEE_ID,
          body:        { type: "Asalariado" },
        })
      ).rejects.toThrow("findById DB error");
    });
  });
});
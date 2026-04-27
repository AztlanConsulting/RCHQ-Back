const employee = require("../../model/employee/create.model");
const { createLog } = require("../../model/log.model");
const consult = require("../../model/employee/get.model");

jest.mock("../../model/employee/get.model", () => ({
  findByCurp: jest.fn(),
  findById: jest.fn(),
  getAllRoles: jest.fn(),
}));

jest.mock("../../model/employee/create.model", () => ({
  create: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
  createLog: jest.fn(),
}));

jest.mock("../../utils/IP", () => ({
  getClientIp: jest.fn(() => "127.0.0.1"),
}));

const { createEmployee } = require("../../service/employee/create.service");

describe("Employee Service - createEmployee", () => {
  const mockUserAdmin = {
    id: "user-1",
    role: "Administrador",
    houseId: "a0000001-0000-4000-8000-000000000001",
  };

  const mockUserCoordinatorSameHouse = {
    id: "user-2",
    role: "Coordinador",
    houseId: "a0000001-0000-4000-8000-000000000001",
  };

  const mockUserCoordinatorOtherHouse = {
    id: "user-3",
    role: "Coordinador",
    houseId: "a0000001-0000-4000-8000-000000000002",
  };

  const mockUserUnauthorized = {
    id: "user-4",
    role: "Empleado",
    houseId: "a0000001-0000-4000-8000-000000000001",
  };

  const mockReq = {
    headers: {
      "cf-connecting-ip": "127.0.0.1",
      "x-forwarded-for": "127.0.0.1",
    },
  };

  const baseEmployee = {
    name: "Juan",
    surname: "Perez",
    email: "test@mail.com",
    curp: "PEPJ800101HDFRRN09",
    houseId: "a0000001-0000-4000-8000-000000000001",
    roleId: "a0000002-0000-4000-8000-000000000002",
    birthDate: "1990-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    employee.create.mockResolvedValue({ employeeId: "emp-1" });
    createLog.mockResolvedValue();
    consult.findByCurp.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("debería crear empleado como admin", async () => {
    const result = await createEmployee(baseEmployee, mockUserAdmin, mockReq);
    expect(result.success).toBe(true);
    expect(result.employeeId).toBeDefined();
    expect(employee.create).toHaveBeenCalled();
  });

  it("coordinator puede crear en su misma casa", async () => {
    const result = await createEmployee(
      baseEmployee,
      mockUserCoordinatorSameHouse,
      mockReq,
    );
    expect(result.success).toBe(true);
  });

  it("coordinator usa su houseId aunque mande otra casa", async () => {
    const data = {
      ...baseEmployee,
      houseId: "a0000001-0000-4000-8000-000000000999",
    };
    const result = await createEmployee(
      data,
      mockUserCoordinatorOtherHouse,
      mockReq,
    );
    expect(result.success).toBe(true);
    expect(employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        houseId: mockUserCoordinatorOtherHouse.houseId,
      }),
    );
  });

  it("debería permitir nombres con acentos y ñ", async () => {
    const data = { ...baseEmployee, name: "Ángel", surname: "Muñoz" };
    const result = await createEmployee(data, mockUserAdmin, mockReq);
    expect(result.success).toBe(true);
  });

  it("debería fallar si falta name", async () => {
    const { name, ...data } = baseEmployee;
    const result = await createEmployee(data, mockUserAdmin, mockReq);
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("email inválido", async () => {
    const result = await createEmployee(
      { ...baseEmployee, email: "correo-mal" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("CURP inválido", async () => {
    const result = await createEmployee(
      { ...baseEmployee, curp: "123" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("roleId inválido", async () => {
    const result = await createEmployee(
      { ...baseEmployee, roleId: "no-uuid" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("RFC inválido", async () => {
    const result = await createEmployee(
      { ...baseEmployee, rfc: "123" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("NSS inválido", async () => {
    const result = await createEmployee(
      { ...baseEmployee, nss: "123" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("CLABE inválida", async () => {
    const result = await createEmployee(
      { ...baseEmployee, bankAccount: "123" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("nombre con números", async () => {
    const result = await createEmployee(
      { ...baseEmployee, name: "Juan123" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("nombre con emojis", async () => {
    const result = await createEmployee(
      { ...baseEmployee, name: "Juan😀" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("nombre con caracteres especiales", async () => {
    const result = await createEmployee(
      { ...baseEmployee, name: "Juan@#" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("apellido con números", async () => {
    const result = await createEmployee(
      { ...baseEmployee, surname: "Perez123" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("debería fallar si el rol no está autorizado", async () => {
    const result = await createEmployee(
      baseEmployee,
      mockUserUnauthorized,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("FORBIDDEN");
  });

  it("debería rechazar intentos de SQL Injection", async () => {
    const result = await createEmployee(
      { ...baseEmployee, name: "Juan'; DROP TABLE employees;--" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("debería rechazar scripts XSS", async () => {
    const result = await createEmployee(
      { ...baseEmployee, name: "<script>alert('xss')</script>" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("nombre demasiado largo", async () => {
    const result = await createEmployee(
      { ...baseEmployee, name: "A".repeat(60) },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("email demasiado largo", async () => {
    const result = await createEmployee(
      { ...baseEmployee, email: `${"a".repeat(70)}@mail.com` },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("debería aplicar trim a nombre y email con espacios extra", async () => {
    await createEmployee(
      { ...baseEmployee, name: "  Juan  ", email: " test@mail.com  " },
      mockUserAdmin,
      mockReq,
    );
    expect(employee.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Juan", email: "test@mail.com" }),
    );
  });

  it("debería convertir el email a minúsculas antes de guardarlo", async () => {
    await createEmployee(
      { ...baseEmployee, email: "JUAN.PEREZ@MAIL.COM" },
      mockUserAdmin,
      mockReq,
    );
    expect(employee.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "juan.perez@mail.com" }),
    );
  });

  it("name no string", async () => {
    const result = await createEmployee(
      { ...baseEmployee, name: 12345 },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("NSS con letras", async () => {
    const result = await createEmployee(
      { ...baseEmployee, nss: "123ABC45678" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("CLABE con letras", async () => {
    const result = await createEmployee(
      { ...baseEmployee, bankAccount: "123ABC456789012345" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("fecha inválida", async () => {
    const result = await createEmployee(
      { ...baseEmployee, birthDate: "2020-13-40" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("debería rechazar fechas de nacimiento imposibles en el pasado", async () => {
    const result = await createEmployee(
      { ...baseEmployee, birthDate: "1850-01-01" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("debería rechazar fechas de nacimiento en el futuro", async () => {
    const result = await createEmployee(
      { ...baseEmployee, birthDate: "2050-01-01" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("debería rechazar el registro si el empleado es un niño", async () => {
    const tenYearsAgo = `${new Date().getFullYear() - 10}-01-01`;
    const result = await createEmployee(
      { ...baseEmployee, birthDate: tenYearsAgo },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("formato inválido imagen", async () => {
    const result = await createEmployee(
      { ...baseEmployee, picture: "foto.exe" },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("múltiples errores", async () => {
    const result = await createEmployee(
      {
        name: "123",
        surname: "!!!",
        email: "mal",
        curp: "123",
        roleId: "no-uuid",
      },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it("debería retornar error si el empleado ya está registrado (Duplicado)", async () => {
    const idExistente = "19c23934-e20a-42f4-b963-fab77caf1a1c";
    consult.findByCurp.mockResolvedValue({
      employee_id: idExistente,
      curp: baseEmployee.curp,
    });
    const result = await createEmployee(baseEmployee, mockUserAdmin, mockReq);
    expect(employee.create).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.type).toBe("CONFLICT");
    expect(result.employeeId).toBe(idExistente);
  });

  it("debería continuar (o retornar error controlado) si el Logger falla", async () => {
    createLog.mockRejectedValue(new Error("Logger error"));
    const result = await createEmployee(baseEmployee, mockUserAdmin, mockReq);
    expect(result.success).toBe(true);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain("el log falló");
  });

  it("debería normalizar CURP a mayúsculas", async () => {
    await createEmployee(
      { ...baseEmployee, curp: "pepj800101hdfrrn09" },
      mockUserAdmin,
      mockReq,
    );
    expect(employee.create).toHaveBeenCalledWith(
      expect.objectContaining({ curp: "PEPJ800101HDFRRN09" }),
    );
  });

  it("debería fallar si campos obligatorios son null", async () => {
    const result = await createEmployee(
      { ...baseEmployee, name: null, email: null },
      mockUserAdmin,
      mockReq,
    );
    expect(result.success).toBe(false);
    expect(result.type).toBe("VALIDATION_ERROR");
  });

  it("coordinator no puede forzar house_id externo", async () => {
    await createEmployee(
      { ...baseEmployee, house_id: "FAKE-HOUSE-ID" },
      mockUserCoordinatorOtherHouse,
      mockReq,
    );
    expect(employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        houseId: mockUserCoordinatorOtherHouse.houseId,
      }),
    );
  });
});

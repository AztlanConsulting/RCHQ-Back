const employee = require("../../model/employee/create.model");
const { createLog } = require("../../model/log.model");
const consult = require("../../model/employee/get.model");

// =====================================================
// MOCKS
// =====================================================

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

// =====================================================
// TEST SUITE
// =====================================================

describe("Employee Service - createEmployee", () => {
    // Variables globales para las pruebas
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

        // Lo dejamos comentado por si necesitas ver errores de Zod en consola mientras depuras
        // jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // =====================================================
    // ÉXITO Y LÓGICA DE NEGOCIO
    // =====================================================

    it("debería crear empleado como admin", async () => {
        // Arrange (Estado base en beforeEach)

        // Act
        const result = await createEmployee(
            baseEmployee,
            mockUserAdmin,
            mockReq,
        );

        // ACTUALIZADO a la nueva respuesta del servicio
        expect(result.success).toBe(true);
        expect(result.employeeId).toBeDefined();
        expect(employee.create).toHaveBeenCalled();
    });

    it("coordinator puede crear en su misma casa", async () => {
        // Arrange (Estado base en beforeEach)

        // Act
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

        // Act
        const result = await createEmployee(
            data,
            mockUserCoordinatorOtherHouse,
            mockReq,
        );

        expect(result.success).toBe(true);
        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({
                houseId: mockUserCoordinatorOtherHouse.houseId, // Fuerza su propia casa
            }),
        );
    });

    it("debería permitir nombres con acentos y ñ", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "Ángel", surname: "Muñoz" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(true);
    });

    // =====================================================
    // VALIDACIONES BÁSICAS (ZOD SCHEMA)
    // =====================================================

    it("debería fallar si falta name", async () => {
        // Arrange
        const { name, ...data } = baseEmployee;

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // ACTUALIZADO para mapear a tipo de error VALIDATION_ERROR
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("email inválido", async () => {
        // Arrange
        const data = { ...baseEmployee, email: "correo-mal" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("CURP inválido", async () => {
        // Arrange
        const data = { ...baseEmployee, curp: "123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("roleId inválido", async () => {
        const data = { ...baseEmployee, roleId: "no-uuid" };
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("RFC inválido", async () => {
        // Arrange
        const data = { ...baseEmployee, rfc: "123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("NSS inválido", async () => {
        // Arrange
        const data = { ...baseEmployee, nss: "123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("CLABE inválida", async () => {
        const data = { ...baseEmployee, bankAccount: "123" };
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    // =====================================================
    // SEGURIDAD Y PERMISOS
    // =====================================================

    it("nombre con números", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "Juan123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("nombre con emojis", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "Juan😀" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("nombre con caracteres especiales", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "Juan@#" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("apellido con números", async () => {
        // Arrange
        const data = { ...baseEmployee, surname: "Perez123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("debería fallar si el rol no está autorizado", async () => {
        // Arrange (Usando el mockUserUnauthorized configurado arriba)

        // Act
        const result = await createEmployee(
            baseEmployee,
            mockUserUnauthorized,
            mockReq,
        );

        // ACTUALIZADO: Evalúa el error del Policy
        expect(result.success).toBe(false);
        expect(result.type).toBe("FORBIDDEN");
    });

    it("debería rechazar intentos de SQL Injection", async () => {
        // Arrange
        const data = {
            ...baseEmployee,
            name: "Juan'; DROP TABLE employees;--",
        };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar scripts XSS", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "<script>alert('xss')</script>" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    // =====================================================
    // NORMALIZACIÓN E INTEGRIDAD (LONGITUDES)
    // =====================================================

    it("nombre demasiado largo", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "A".repeat(60) };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("email demasiado largo", async () => {
        // Arrange
        const data = { ...baseEmployee, email: `${"a".repeat(70)}@mail.com` };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("debería aplicar trim a nombre y email con espacios extra", async () => {
        // Arrange
        const data = {
            ...baseEmployee,
            name: "  Juan  ",
            email: " test@mail.com  ",
        };

        // Act
        await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({ name: "Juan", email: "test@mail.com" }),
        );
    });

    it("debería convertir el email a minúsculas antes de guardarlo", async () => {
        // Arrange
        const data = { ...baseEmployee, email: "JUAN.PEREZ@MAIL.COM" };

        // Act
        await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({ email: "juan.perez@mail.com" }),
        );
    });

    // =====================================================
    // TIPOS Y NUMÉRICOS
    // =====================================================

    it("name no string", async () => {
        // Arrange
        const data = { ...baseEmployee, name: 12345 };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("NSS con letras", async () => {
        // Arrange
        const data = { ...baseEmployee, nss: "123ABC45678" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("CLABE con letras", async () => {
        const data = { ...baseEmployee, bankAccount: "123ABC456789012345" };
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    // =====================================================
    // VALIDACIONES DE FECHAS AVANZADAS
    // =====================================================

    it("fecha inválida", async () => {
        const data = { ...baseEmployee, birthDate: "2020-13-40" };
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar fechas de nacimiento imposibles en el pasado", async () => {
        const data = { ...baseEmployee, birthDate: "1850-01-01" };
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar fechas de nacimiento en el futuro", async () => {
        const data = { ...baseEmployee, birthDate: "2050-01-01" };
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar el registro si el empleado es un niño", async () => {
        // Arrange
        const today = new Date();
        const tenYearsAgo = `${today.getFullYear() - 10}-01-01`;
        const data = { ...baseEmployee, birthDate: tenYearsAgo };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    // =====================================================
    // IMAGEN Y MULTI ERROR
    // =====================================================

    it("formato inválido imagen", async () => {
        // Arrange
        const data = { ...baseEmployee, picture: "foto.exe" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("múltiples errores", async () => {
        // Arrange
        const data = {
            name: "123",
            surname: "!!!",
            email: "mal",
            curp: "123",
            roleId: "no-uuid",
        };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
        // Extra: Podemos verificar que Zod arroje más de un error
        expect(result.errors.length).toBeGreaterThan(1);
    });

    // =====================================================
    // INFRAESTRUCTURA Y CONFLICTOS
    // =====================================================

    it("debería retornar error si el empleado ya está registrado (Duplicado)", async () => {
        const idExistente = "19c23934-e20a-42f4-b963-fab77caf1a1c";
        consult.findByCurp.mockResolvedValue({
            employee_id: idExistente,
            curp: baseEmployee.curp,
        });

        // Act
        const result = await createEmployee(
            baseEmployee,
            mockUserAdmin,
            mockReq,
        );

        // Assert
        expect(employee.create).not.toHaveBeenCalled();

        // ACTUALIZADO: Evalúa la lógica de CONFLICTO
        expect(result.success).toBe(false);
        expect(result.type).toBe("CONFLICT");
        expect(result.employeeId).toBe(idExistente);
    });

    it("debería continuar (o retornar error controlado) si el Logger falla", async () => {
        // Arrange
        createLog.mockRejectedValue(new Error("Logger error"));

        // Act
        const result = await createEmployee(
            baseEmployee,
            mockUserAdmin,
            mockReq,
        );

        // ACTUALIZADO: Evalúa el estado exitoso pero con warning
        expect(result.success).toBe(true);
        expect(result.warning).toBeDefined();
        expect(result.warning).toContain("el log falló");
    });

    it("debería normalizar CURP a mayúsculas", async () => {
        // Arrange
        const data = { ...baseEmployee, curp: "pepj800101hdfrrn09" };

        // Act
        await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({
                curp: "PEPJ800101HDFRRN09",
            }),
        );
    });

    it("debería fallar si campos obligatorios son null", async () => {
        // Arrange
        const data = { ...baseEmployee, name: null, email: null };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("coordinator no puede forzar house_id externo", async () => {
        // Arrange
        const data = { ...baseEmployee, house_id: "FAKE-HOUSE-ID" };

        // Act
        await createEmployee(data, mockUserCoordinatorOtherHouse, mockReq);

        // Assert
        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({
                houseId: mockUserCoordinatorOtherHouse.houseId,
            }),
        );
    });
});
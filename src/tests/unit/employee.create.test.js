const employee = require("../../model/employee/employeeAdd.model");
const { createLog } = require("../../model/log.model");
const consult = require("../../model/employee/consult.model");

// =====================================================
// MOCKS
// =====================================================

jest.mock("../../model/employee/consult.model", () => ({
    findByCurp: jest.fn(),
    findById: jest.fn(),
    getAllRoles: jest.fn(),
}));

jest.mock("../../model/employee/employeeAdd.model", () => ({
    create: jest.fn(),
}));

jest.mock("../../model/log.model", () => ({
    createLog: jest.fn(),
}));

jest.mock("../../utils/IP", () => ({
    getClientIp: jest.fn(() => "127.0.0.1"),
}));

const {
    createEmployee,
} = require("../../service/employee/employeeAdd.service");

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
        house_id: "a0000001-0000-4000-8000-000000000001",
        role_id: "a0000002-0000-4000-8000-000000000002",
        birth_date: "1990-01-01",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        employee.create.mockResolvedValue({ employee_id: "emp-1" });
        createLog.mockResolvedValue();
        consult.findByCurp.mockResolvedValue(null);
        jest.spyOn(console, "error").mockImplementation(() => {});
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

        // Assert
        expect(result.status).toBe(201);
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

        // Assert
        expect(result.status).toBe(201);
    });

    it("coordinator usa su house_id aunque mande otra casa", async () => {
        // Arrange
        const data = {
            ...baseEmployee,
            house_id: "a0000001-0000-4000-8000-000000000999",
        };

        // Act
        const result = await createEmployee(
            data,
            mockUserCoordinatorOtherHouse,
            mockReq,
        );

        // Assert
        expect(result.status).toBe(201);
        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({
                house_id: mockUserCoordinatorOtherHouse.houseId,
            }),
        );
    });

    it("debería permitir nombres con acentos y ñ", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "Ángel", surname: "Muñoz" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(201);
    });

    // =====================================================
    // VALIDACIONES BÁSICAS
    // =====================================================

    it("debería fallar si falta name", async () => {
        // Arrange
        const { name, ...data } = baseEmployee;

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("email inválido", async () => {
        // Arrange
        const data = { ...baseEmployee, email: "correo-mal" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("CURP inválido", async () => {
        // Arrange
        const data = { ...baseEmployee, curp: "123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("role_id inválido", async () => {
        // Arrange
        const data = { ...baseEmployee, role_id: "no-uuid" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("RFC inválido", async () => {
        // Arrange
        const data = { ...baseEmployee, rfc: "123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("NSS inválido", async () => {
        // Arrange
        const data = { ...baseEmployee, nss: "123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("CLABE inválida", async () => {
        // Arrange
        const data = { ...baseEmployee, bank_account: "123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    // =====================================================
    // SEGURIDAD Y PERMISOS
    // =====================================================

    it("nombre con números", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "Juan123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("nombre con emojis", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "Juan😀" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("nombre con caracteres especiales", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "Juan@#" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("apellido con números", async () => {
        // Arrange
        const data = { ...baseEmployee, surname: "Perez123" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("debería fallar si el rol no está autorizado", async () => {
        // Arrange (Usando el mockUserUnauthorized configurado arriba)

        // Act
        const result = await createEmployee(
            baseEmployee,
            mockUserUnauthorized,
            mockReq,
        );

        // Assert
        expect(result.status).toBe(403);
    });

    it("debería rechazar intentos de SQL Injection", async () => {
        // Arrange
        const data = {
            ...baseEmployee,
            name: "Juan'; DROP TABLE employees;--",
        };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("debería rechazar scripts XSS", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "<script>alert('xss')</script>" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    // =====================================================
    // NORMALIZACIÓN E INTEGRIDAD (LONGITUDES)
    // =====================================================

    it("nombre demasiado largo", async () => {
        // Arrange
        const data = { ...baseEmployee, name: "A".repeat(60) };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("email demasiado largo", async () => {
        // Arrange
        const data = { ...baseEmployee, email: `${"a".repeat(70)}@mail.com` };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
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

        // Assert
        expect(result.status).toBe(400);
    });

    it("NSS con letras", async () => {
        // Arrange
        const data = { ...baseEmployee, nss: "123ABC45678" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("CLABE con letras", async () => {
        // Arrange
        const data = { ...baseEmployee, bank_account: "123ABC456789012345" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    // =====================================================
    // VALIDACIONES DE FECHAS AVANZADAS
    // =====================================================

    it("fecha inválida", async () => {
        // Arrange
        const data = { ...baseEmployee, birth_date: "2020-13-40" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("debería rechazar fechas de nacimiento imposibles en el pasado", async () => {
        // Arrange
        const data = { ...baseEmployee, birth_date: "1850-01-01" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("debería rechazar fechas de nacimiento en el futuro", async () => {
        // Arrange
        const data = { ...baseEmployee, birth_date: "2050-01-01" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("debería rechazar el registro si el empleado es un niño", async () => {
        // Arrange
        const today = new Date();
        const tenYearsAgo = `${today.getFullYear() - 10}-01-01`;
        const data = { ...baseEmployee, birth_date: tenYearsAgo };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect([400, 422]).toContain(result.status);
    });

    // =====================================================
    // IMAGEN Y MULTI ERROR
    // =====================================================

    it("formato inválido imagen", async () => {
        // Arrange
        const data = { ...baseEmployee, picture: "foto.exe" };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    it("múltiples errores", async () => {
        // Arrange
        const data = {
            name: "123",
            surname: "!!!",
            email: "mal",
            curp: "123",
            role_id: "no-uuid",
        };

        // Act
        const result = await createEmployee(data, mockUserAdmin, mockReq);

        // Assert
        expect(result.status).toBe(400);
    });

    // =====================================================
    // INFRAESTRUCTURA Y CONFLICTOS (CORREGIDOS)
    // =====================================================

    it("debería retornar error y redirect si el empleado ya está registrado (Duplicado)", async () => {
        // Arrange
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
        expect(result.status).toBe(409);
        expect(result.body).toEqual({
            error: "Empleado ya existente",
            redirect: `/employee/${idExistente}`,
        });
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

        // Assert
        expect([201, 500]).toContain(result.status);
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

        // Assert
        expect(result.status).toBe(400);
    });

    it("coordinator no puede forzar house_id externo", async () => {
        // Arrange
        const data = { ...baseEmployee, house_id: "FAKE-HOUSE-ID" };

        // Act
        await createEmployee(data, mockUserCoordinatorOtherHouse, mockReq);

        // Assert
        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({
                house_id: mockUserCoordinatorOtherHouse.houseId,
            }),
        );
    });
});

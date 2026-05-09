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

jest.mock("../../utils/ip", () => ({
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
        role: "Admin",
        houseId: "a0000001-0000-4000-8000-000000000001",
        privileges: ["viewEmployees", "createEmployees", "manageEmployees", "viewDocuments", "manageDocuments"],
    };

    const mockUserCoordinatorSameHouse = {
        id: "user-2",
        role: "Coordinador",
        houseId: "a0000001-0000-4000-8000-000000000001",
        privileges: ["viewEmployees", "createEmployees", "manageEmployees", "viewDocuments", "manageDocuments"],
    };

    const mockUserCoordinatorOtherHouse = {
        id: "user-3",
        role: "Coordinador",
        houseId: "a0000001-0000-4000-8000-000000000002",
        privileges: ["viewEmployees", "createEmployees", "manageEmployees", "viewDocuments", "manageDocuments"],
    };

    const mockUserUnauthorized = {
        id: "user-4",
        role: "Empleado",
        houseId: "a0000001-0000-4000-8000-000000000001",
        privileges: [],
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
        type: "nomina",
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

    // =====================================================
    // ÉXITO Y LÓGICA DE NEGOCIO
    // =====================================================

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

    // =====================================================
    // VALIDACIONES BÁSICAS (ZOD SCHEMA)
    // =====================================================

    it("debería fallar si falta name", async () => {
        const data = { ...baseEmployee };
        delete data.name;

        const result = await createEmployee(data, mockUserAdmin, mockReq);

        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("email inválido", async () => {
        const data = { ...baseEmployee, email: "correo-mal" };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("CURP inválido", async () => {
        const data = { ...baseEmployee, curp: "123" };

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
        const data = { ...baseEmployee, rfc: "123" };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("NSS inválido", async () => {
        const data = { ...baseEmployee, nss: "123" };

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
        const data = { ...baseEmployee, name: "Juan123" };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("nombre con emojis", async () => {
        const data = { ...baseEmployee, name: "Juan😀" };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("nombre con caracteres especiales", async () => {
        const data = { ...baseEmployee, name: "Juan@#" };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("apellido con números", async () => {
        const data = { ...baseEmployee, surname: "Perez123" };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
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
        const data = {
            ...baseEmployee,
            name: "Juan'; DROP TABLE employees;--",
        };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("debería rechazar scripts XSS", async () => {
        const data = { ...baseEmployee, name: "<script>alert('xss')</script>" };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    // =====================================================
    // NORMALIZACIÓN E INTEGRIDAD (LONGITUDES)
    // =====================================================

    it("nombre demasiado largo", async () => {
        const data = { ...baseEmployee, name: "A".repeat(60) };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("email demasiado largo", async () => {
        const data = { ...baseEmployee, email: `${"a".repeat(70)}@mail.com` };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("debería aplicar trim a nombre y email con espacios extra", async () => {
        const data = {
            ...baseEmployee,
            name: "  Juan  ",
            email: " test@mail.com  ",
        };

        await createEmployee(data, mockUserAdmin, mockReq);

        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({ name: "Juan", email: "test@mail.com" }),
        );
    });

    it("debería convertir el email a minúsculas antes de guardarlo", async () => {
        const data = { ...baseEmployee, email: "JUAN.PEREZ@MAIL.COM" };

        await createEmployee(data, mockUserAdmin, mockReq);

        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({ email: "juan.perez@mail.com" }),
        );
    });

    // =====================================================
    // TIPOS Y NUMÉRICOS
    // =====================================================

    it("name no string", async () => {
        const data = { ...baseEmployee, name: 12345 };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("NSS con letras", async () => {
        const data = { ...baseEmployee, nss: "123ABC45678" };

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
        const today = new Date();
        const tenYearsAgo = `${today.getFullYear() - 10}-01-01`;
        const data = { ...baseEmployee, birthDate: tenYearsAgo };

        const result = await createEmployee(data, mockUserAdmin, mockReq);

        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    // =====================================================
    // IMAGEN Y MULTI ERROR
    // =====================================================

    it("formato inválido imagen", async () => {
        const data = { ...baseEmployee, picture: "foto.exe" };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("múltiples errores", async () => {
        const data = {
            name: "123",
            surname: "!!!",
            email: "mal",
            curp: "123",
            roleId: "no-uuid",
        };

        const result = await createEmployee(data, mockUserAdmin, mockReq);
        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
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

        const result = await createEmployee(
            baseEmployee,
            mockUserAdmin,
            mockReq,
        );

        expect(employee.create).not.toHaveBeenCalled();
        expect(result.success).toBe(false);
        expect(result.type).toBe("CONFLICT");
        expect(result.employeeId).toBe(idExistente);
    });

    it("debería continuar (o retornar error controlado) si el Logger falla", async () => {
        createLog.mockRejectedValue(new Error("Logger error"));

        const result = await createEmployee(
            baseEmployee,
            mockUserAdmin,
            mockReq,
        );

        expect(result.success).toBe(true);
        expect(result.warning).toBeDefined();
        expect(result.warning).toContain("el log falló");
    });

    it("debería normalizar CURP a mayúsculas", async () => {
        const data = { ...baseEmployee, curp: "pepj800101hdfrrn09" };

        await createEmployee(data, mockUserAdmin, mockReq);

        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({
                curp: "PEPJ800101HDFRRN09",
            }),
        );
    });

    it("debería fallar si campos obligatorios son null", async () => {
        const data = { ...baseEmployee, name: null, email: null };

        const result = await createEmployee(data, mockUserAdmin, mockReq);

        expect(result.success).toBe(false);
        expect(result.type).toBe("VALIDATION_ERROR");
    });

    it("coordinator no puede forzar house_id externo", async () => {
        const data = { ...baseEmployee, house_id: "FAKE-HOUSE-ID" };

        await createEmployee(data, mockUserCoordinatorOtherHouse, mockReq);

        expect(employee.create).toHaveBeenCalledWith(
            expect.objectContaining({
                houseId: mockUserCoordinatorOtherHouse.houseId,
            }),
        );
    });
});
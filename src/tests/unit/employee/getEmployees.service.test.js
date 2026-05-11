// tests/unit/employeeGetAll.service.test.js

const employeeModel = require("../../../model/employee/get.model");

// =====================================================
// MOCKS
// =====================================================

jest.mock("../../../model/employee/get.model", () => ({
    getEmployees: jest.fn(),
}));

const { getEmployees } = require("../../../service/employee/get.service");

// =====================================================
// TEST SUITE
// =====================================================

describe("Employee Service - getEmployees", () => {
    const houseId = "house-123";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("1. Casos de Éxito y Transformación de Datos", () => {
        it("debería retornar empleados activos por default y mapear datos correctamente", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [
                    {
                        employeeId: "1",
                        name: "Juan",
                        surname: "Perez",
                        picture: "juan.jpg",
                        isActive: true,
                        roleName: "Chef",
                    },
                ],
                total: 1,
            });

            const result = await getEmployees(houseId);

            expect(employeeModel.getEmployees).toHaveBeenCalledWith(
                houseId,
                true,
                "",
                0,
                6,
            );
            expect(result.data[0]).toEqual({
                employeeId: "1",
                fullName: "Juan Perez",
                role: "Chef",
                picture: "juan.jpg",
                status: true,
            });
            expect(result.pagination).toEqual({
                page: 1,
                limit: 6,
                total: 1,
                totalPages: 1,
            });
        });

        it("debería retornar empleados inactivos si se especifica", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 0,
            });

            await getEmployees(houseId, "false");

            expect(employeeModel.getEmployees).toHaveBeenCalledWith(
                houseId,
                false,
                "",
                0,
                6,
            );
        });

        it("debería manejar nombres o apellidos faltantes al concatenar fullName", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [
                    {
                        employeeId: "2",
                        name: "Maria",
                        surname: null,
                        picture: null,
                        isActive: true,
                        roleName: "Limpieza",
                    },
                ],
                total: 1,
            });

            const result = await getEmployees(houseId);

            expect(result.data[0].fullName).toBe("Maria");
            expect(result.data[0].picture).toBeNull();
        });
    });

    describe("2. Paginación", () => {
        it("debería aplicar el offset y limit de paginación correctamente", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 50,
            });

            const result = await getEmployees(houseId, "true", "3", "6");

            expect(employeeModel.getEmployees).toHaveBeenCalledWith(
                houseId,
                true,
                "",
                12,
                6,
            );
            expect(result.pagination).toEqual({
                page: 3,
                limit: 6,
                total: 50,
                totalPages: 9,
            });
        });

        it("debería calcular correctamente totalPages cuando el total es múltiplo exacto del límite", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 12,
            });

            const result = await getEmployees(houseId, "true", "1", "6");

            expect(result.pagination.totalPages).toBe(2);
        });

        it("debería usar valores default si page y limit son inválidos (NaN, letras)", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 0,
            });

            await getEmployees(houseId, "true", "-1", "abc");

            expect(employeeModel.getEmployees).toHaveBeenCalledWith(
                houseId,
                true,
                "",
                0,
                6,
            );
        });

        it("debería usar página 1 por default si se envía página 0 o negativa", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 0,
            });

            await getEmployees(houseId, "true", "0", "10");

            expect(employeeModel.getEmployees).toHaveBeenCalledWith(
                houseId,
                true,
                "",
                0,
                10,
            );
        });
    });

    describe("3. Búsqueda y Filtros", () => {
        it("debería buscar pasando el parámetro de búsqueda al modelo", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 0,
            });

            await getEmployees(houseId, "true", "1", "6", "juan");

            expect(employeeModel.getEmployees).toHaveBeenCalledWith(
                houseId,
                true,
                "juan",
                0,
                6,
            );
        });

        it("debería limpiar espacios extremos en la búsqueda", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 0,
            });

            await getEmployees(houseId, "true", "1", "6", "   juan   ");

            expect(employeeModel.getEmployees).toHaveBeenCalledWith(
                houseId,
                true,
                "juan",
                0,
                6,
            );
        });

        it("debería manejar strings 'true'/'false' y convertirlos a booleanos para isActive", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 0,
            });

            await getEmployees(houseId, "false");
            expect(employeeModel.getEmployees).toHaveBeenCalledWith(
                houseId,
                false,
                "",
                0,
                6,
            );

            await getEmployees(houseId, "true");
            expect(employeeModel.getEmployees).toHaveBeenCalledWith(
                houseId,
                true,
                "",
                0,
                6,
            );
        });
    });

    describe("4. Manejo de Errores y Casos Límite (Edge Cases)", () => {
        it("debería retornar una lista vacía si la consulta no arroja resultados", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 0,
            });

            const result = await getEmployees(houseId);

            expect(result.data).toEqual([]);
            expect(result.pagination.total).toBe(0);
            expect(result.pagination.totalPages).toBe(0);
        });

        it("debería manejar el caso donde el houseId es null (ej. fallo en capa superior)", async () => {
            employeeModel.getEmployees.mockResolvedValue({
                employees: [],
                total: 0,
            });

            const result = await getEmployees(null);

            expect(result.data).toEqual([]);
            expect(result.pagination.total).toBe(0);
        });

        it("debería propagar el error si la base de datos (modelo) falla", async () => {
            const dbError = new Error("Error de conexión a la BD");
            employeeModel.getEmployees.mockRejectedValue(dbError);

            await expect(getEmployees(houseId)).rejects.toThrow(
                "Error de conexión a la BD",
            );
        });

        it("debería manejar una respuesta malformada del modelo de forma segura", async () => {
            employeeModel.getEmployees.mockResolvedValue(undefined);

            await expect(getEmployees(houseId)).rejects.toThrow();
        });
    });
});

// tests/unit/employeeGetAll.service.test.js

const employeeModel = require("../../model/employee/get.model");

// =====================================================
// MOCKS
// =====================================================

jest.mock("../../model/employee/get.model", () => ({
  getEmployees: jest.fn(),
}));

const { getEmployees } = require("../../service/employee/get.service");

// =====================================================
// TEST SUITE
// =====================================================

describe("Employee Service - getEmployees", () => {
  const houseId = "house-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // CONSULTA EXITOSA Y VALORES DEFAULT
  // =====================================================

  it("debería retornar empleados activos por default", async () => {
    // Arrange
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

    // Act
    const result = await getEmployees(houseId);

    // Assert
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

  it("debería retornar empleados inactivos", async () => {
    // Arrange
    employeeModel.getEmployees.mockResolvedValue({
      employees: [],
      total: 0,
    });

    // Act
    await getEmployees(houseId, "false");

    // Assert
    expect(employeeModel.getEmployees).toHaveBeenCalledWith(
      houseId,
      false,
      "",
      0,
      6,
    );
  });

  // =====================================================
  // PAGINACIÓN
  // =====================================================

  it("debería aplicar paginación correctamente", async () => {
    // Arrange
    employeeModel.getEmployees.mockResolvedValue({
      employees: [],
      total: 50,
    });

    // Act
    const result = await getEmployees(houseId, "true", "3", "6");

    // Assert
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

  // =====================================================
  // BÚSQUEDA
  // =====================================================

  it("debería buscar por nombre o apellido", async () => {
    // Arrange
    employeeModel.getEmployees.mockResolvedValue({
      employees: [],
      total: 0,
    });

    // Act
    await getEmployees(houseId, "true", "1", "6", "juan");

    // Assert
    expect(employeeModel.getEmployees).toHaveBeenCalledWith(
      houseId,
      true,
      "juan",
      0,
      6,
    );
  });

  it("debería limpiar espacios en búsqueda", async () => {
    // Arrange
    employeeModel.getEmployees.mockResolvedValue({
      employees: [],
      total: 0,
    });

    // Act
    await getEmployees(houseId, "true", "1", "6", "   juan   ");

    // Assert
    expect(employeeModel.getEmployees).toHaveBeenCalledWith(
      houseId,
      true,
      "juan",
      0,
      6,
    );
  });

  // =====================================================
  // VALIDACIONES Y FALLBACKS
  // =====================================================

  it("debería usar valores default si page y limit son inválidos", async () => {
    // Arrange
    employeeModel.getEmployees.mockResolvedValue({
      employees: [],
      total: 0,
    });

    // Act
    await getEmployees(houseId, "true", "-1", "abc");

    // Assert
    expect(employeeModel.getEmployees).toHaveBeenCalledWith(
      houseId,
      true,
      "",
      0,
      6,
    );
  });
});

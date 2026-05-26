jest.mock("../../model/blacklist/get.model", () => ({
    getBlacklistedEmployees: jest.fn(),
}));

const { getBlacklistedEmployees } = require("../../model/blacklist/get.model");
const { getBlacklist } = require("../../service/blacklist/get.service");
const RESPONSES = require("../../utils/responses");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("getBlacklist service", () => {
    it("debe retornar INVALID_PAGINATION si la página es menor a 1", async () => {
        const result = await getBlacklist({ page: "0" });
        
        expect(result.code).toBe(RESPONSES.BLACKLIST.INVALID_PAGINATION);
        expect(getBlacklistedEmployees).not.toHaveBeenCalled();
    });

    it("debe retornar INVALID_PAGINATION si isBlacklisted no es un booleano válido", async () => {
        const result = await getBlacklist({ isBlacklisted: "no-soy-booleano" });
        
        expect(result.code).toBe(RESPONSES.BLACKLIST.INVALID_PAGINATION);
        expect(getBlacklistedEmployees).not.toHaveBeenCalled();
    });

    it("debe retornar FETCHED con lista vacía si no se encuentran empleados en la base de datos", async () => {
        getBlacklistedEmployees.mockResolvedValue({ employees: [], pagination: {} });

        const result = await getBlacklist({ page: "1", limit: "10", role: "Coordinador", houseId: "house-123" });

        expect(result.code).toBe(RESPONSES.BLACKLIST.FETCHED);
        expect(result.data).toEqual({ employees: [], pagination: {} });
        expect(getBlacklistedEmployees).toHaveBeenCalledWith({ page: 1, limit: 10, role: "Coordinador", houseId: "house-123" });
    });

    it("debe retornar FETCHED y los datos si existen empleados que coincidan", async () => {
        const mockData = {
            employees: [{ curp: "EJEMPLO900101", isBlacklisted: true }],
            pagination: { totalItems: 1, totalPages: 1, currentPage: 1 }
        };
        getBlacklistedEmployees.mockResolvedValue(mockData);

        const result = await getBlacklist({ isBlacklisted: "true", role: "Administrador" });

        expect(result.code).toBe(RESPONSES.BLACKLIST.FETCHED);
        expect(result.data).toEqual(mockData);
        expect(getBlacklistedEmployees).toHaveBeenCalledWith({ page: 1, limit: 10, isBlacklisted: true, role: "Administrador", houseId: undefined });
    });

    it("pasa search al modelo cuando se busca por nombre o apellido", async () => {
        getBlacklistedEmployees.mockResolvedValue({ employees: [], pagination: {} });

        await getBlacklist({ search: "María Pérez", role: "Administrador" });

        expect(getBlacklistedEmployees).toHaveBeenCalledWith({
            page: 1,
            limit: 10,
            search: "María Pérez",
            role: "Administrador",
            houseId: undefined,
        });
    });

    it("debe retornar INTERNAL_ERROR si ocurre una excepción inesperada en el modelo", async () => {
        getBlacklistedEmployees.mockRejectedValue(new Error("Error de BD"));

        const result = await getBlacklist({});

        expect(result.code).toBe(RESPONSES.BLACKLIST.INTERNAL_ERROR);
    });
});
